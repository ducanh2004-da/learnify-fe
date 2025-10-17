// MindmapBox.tsx
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "@iconify/react";

/**
 * MindmapBox.tsx - fixed version
 * - no MutationObserver (avoids infinite recompute)
 * - compute connectors on expanded/root changes + resize/scroll (debounced via rAF)
 * - expanded default: only root open
 * - avoids DOM nesting issues (no <p> containing <div>/<h3>)
 *
 * Usage:
 * <MindmapBox courseId="..." graphqlEndpoint="http://localhost:10000/graphql" />
 */

type ApiNode = {
  id: string;
  title: string;
  description?: string | null;
  children?: ApiNode[] | null;
};

type ApiMindmap = {
  id: string;
  title: string;
  createdAt?: string;
  nodes: ApiNode[];
};

type MindmapNode = {
  id: string;
  title: string;
  description?: string | null;
  children: MindmapNode[]; // always array
};

type Props = {
  courseId?: string;
  graphqlEndpoint?: string;
  initiallyExpanded?: string[]; // optional
  maxConnectorStroke?: number;
};

const QUERY = `
query GetMindmap($courseId: String!) {
  getMindMapByCourse(courseId: $courseId) {
    id
    title
    nodes {
      id
      title
      description
      children {
        id
        title
        description
        children {
          id
          title
          description
          children {
            id
            title
            description
          }
        }
      }
    }
  }
}
`;

/* map API node to UI node (always return children array) */
function mapApiNode(n: ApiNode): MindmapNode {
  return {
    id: n.id,
    title: n.title,
    description: n.description ?? null,
    children: Array.isArray(n.children) ? n.children.map(mapApiNode) : [],
  };
}

interface NodeProps {
  node: MindmapNode;
  depth: number;
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}

const NodeBubble: React.FC<NodeProps> = ({
  node,
  depth,
  expanded,
  toggle,
  registerRef,
}) => {
  const hasChildren = node.children.length > 0;
  const isOpen = !!expanded[node.id];

  return (
    <div className="relative group" data-nodeid={node.id}>
      <div
        ref={(el) => registerRef(node.id, el)}
        role={hasChildren ? "button" : undefined}
        tabIndex={hasChildren ? 0 : -1}
        onClick={() => hasChildren && toggle(node.id)}
        onKeyDown={(e) => {
          if (hasChildren && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            toggle(node.id);
          }
        }}
        className={`flex items-start gap-3 p-3 pl-4 pr-4 rounded-full shadow-lg
          transition-transform transform hover:scale-[1.03] cursor-pointer select-none
          bg-gradient-to-r from-white to-blue-50 dark:from-zinc-900 dark:to-zinc-800
          border border-blue-100 dark:border-zinc-700`}
        style={{
          minWidth: 160,
          maxWidth: 360,
        }}
      >
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                        bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-md"
        >
          <span className="text-sm font-semibold">
            {node.title?.charAt(0)?.toUpperCase() ?? "?"}
          </span>
        </div>

        <div className="flex-1">
          <div className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100">
            {node.title}
          </div>
          {node.description && (
            <div className="text-xs md:text-sm text-slate-500 dark:text-zinc-300 mt-1">
              {node.description}
            </div>
          )}
        </div>

        {hasChildren ? (
          <div className="ml-2 opacity-80">
            <Icon
              icon={isOpen ? "mdi:chevron-down" : "mdi:chevron-right"}
              className="text-xl text-blue-600 dark:text-blue-300"
            />
          </div>
        ) : (
          <div className="w-6" />
        )}
      </div>

      {/* render children only when open */}
      {hasChildren && isOpen && (
        <div className="mt-4 ml-8" aria-hidden={!isOpen}>
          {node.children.map((child) => (
            <div key={child.id} className="mb-4">
              <NodeBubble
                node={child}
                depth={depth + 1}
                expanded={expanded}
                toggle={toggle}
                registerRef={registerRef}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MindmapBox: React.FC<Props> = ({
  courseId,
  graphqlEndpoint = "/graphql",
  initiallyExpanded = [],
  maxConnectorStroke = 2,
}) => {
  const [rootNode, setRootNode] = useState<MindmapNode | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // expanded state: initialize from initiallyExpanded but we'll set root true after fetch
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initiallyExpanded.map((id) => [id, true]))
  );

  // refs for DOM nodes and container
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [paths, setPaths] = useState<string[]>([]);

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    nodeRefs.current[id] = el;
  }, []);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  /* Fetch data */
  useEffect(() => {
    if (!courseId) {
      setRootNode(null);
      setTitle(null);
      setError("No courseId provided");
      setLoading(false);
      return;
    }

    let aborted = false;
    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(graphqlEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ query: QUERY, variables: { courseId } }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Network error ${res.status}: ${text}`);
        }

        const json = await res.json();
        if (json.errors && json.errors.length) {
          throw new Error(json.errors.map((e: any) => e.message).join("; "));
        }

        const apiMindmap: ApiMindmap | null =
          json.data?.getMindMapByCourse ?? null;

        if (!apiMindmap) {
          if (!aborted) {
            setRootNode(null);
            setTitle(null);
          }
          return;
        }

        const mappedRoot: MindmapNode = {
          id: apiMindmap.id ?? "root",
          title: apiMindmap.title ?? "Mindmap",
          description: null,
          children: Array.isArray(apiMindmap.nodes)
            ? apiMindmap.nodes.map(mapApiNode)
            : [],
        };

        if (!aborted) {
          setRootNode(mappedRoot);
          setTitle(apiMindmap.title ?? null);

          // set expanded to only include the root by default (do NOT auto-open children)
          setExpanded((prev) => ({ [mappedRoot.id]: true, ...prev }));
        }
      } catch (err: any) {
        if (!aborted) setError(err.message ?? "Unknown error");
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      aborted = true;
      controller.abort();
    };
  }, [courseId, graphqlEndpoint]);

  /* Compute connector paths after layout.
     - Debounced using requestAnimationFrame
     - Recompute when rootNode or expanded changes or on resize/scroll
     - Avoid MutationObserver to prevent potential loops */
  useLayoutEffect(() => {
    let rafId: number | null = null;
    const container = containerRef.current;

    function computePathsNow() {
      const cont = containerRef.current;
      if (!cont || !rootNode) {
        setPaths([]);
        return;
      }
      const contRect = cont.getBoundingClientRect();
      const newPaths: string[] = [];

      const centerOf = (el: HTMLDivElement) => {
        const r = el.getBoundingClientRect();
        return {
          x: r.left + r.width / 2 - contRect.left,
          y: r.top + r.height / 2 - contRect.top,
        };
      };

      const traverse = (node: MindmapNode) => {
        // only process if node is expanded (otherwise children are not visible)
        if (!expanded[node.id]) return;

        const parentEl = nodeRefs.current[node.id];
        if (!parentEl) {
          // parent not mounted in DOM (maybe not visible yet)
        }

        for (const child of node.children) {
          const childEl = nodeRefs.current[child.id];
          if (parentEl && childEl) {
            // ensure elements are visible (offsetParent truthy is a quick test)
            if (!parentEl.offsetParent || !childEl.offsetParent) {
              // not visible in layout (skip)
            } else {
              const p = centerOf(parentEl);
              const c = centerOf(childEl);
              const dx = Math.abs(c.x - p.x);
              const controlOffset = Math.max(40, dx * 0.28);
              const path = `M ${p.x} ${p.y} C ${p.x + controlOffset} ${p.y} ${c.x - controlOffset} ${c.y} ${c.x} ${c.y}`;
              newPaths.push(path);
            }
          }
          traverse(child);
        }
      };

      traverse(rootNode);
      setPaths(newPaths);
    }

    function scheduleCompute() {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        computePathsNow();
        rafId = null;
      });
    }

    // initial compute
    scheduleCompute();

    // recompute when window resizes or scrolls (debounced)
    const onResize = () => scheduleCompute();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [rootNode, expanded]);

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      <div className="relative rounded-3xl bg-white/80 dark:bg-zinc-900/80 shadow-2xl border border-primary/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              <Icon icon="mdi:mind-map" className="text-3xl text-blue-600" />
            </div>
            <div>
              {/* Use div with role=heading to avoid nesting issues */}
              <div
                role="heading"
                aria-level={3}
                className="text-2xl font-bold text-slate-800 dark:text-slate-100"
              >
                {title ?? "Mindmap"}
              </div>
              <div className="text-sm text-zinc-500">
                Visual course mind map — click nodes to expand
              </div>
            </div>
          </div>

          <div className="text-sm text-zinc-500">
            {loading ? "Loading…" : error ? "Error" : "Ready"}
          </div>
        </div>

        {/* SVG overlay for connectors */}
        <div ref={containerRef} className="relative min-h-[220px]">
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${containerRef.current?.clientWidth ?? 1000} ${
              containerRef.current?.clientHeight ?? 600
            }`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="connectorGradient" x1="0" x2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {paths.map((p, i) => (
              <path
                key={i}
                d={p}
                stroke="url(#connectorGradient)"
                strokeWidth={maxConnectorStroke}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.95}
              />
            ))}
          </svg>

          <div className="flex flex-col items-stretch gap-4">
            {loading && (
              <div className="py-12 flex justify-center">
                <div className="animate-pulse text-zinc-400">Đang tải mindmap…</div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && !rootNode && (
              <div className="p-6 text-zinc-600">Không tìm thấy mindmap cho khoá học này.</div>
            )}

            {!loading && rootNode && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-center">
                  <div
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 text-white shadow-xl border border-blue-700"
                    ref={(el) => registerRef(rootNode.id, el)}
                  >
                    <div className="text-lg font-bold">{rootNode.title}</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-6">
                  {rootNode.children.map((node) => (
                    <div key={node.id} className="flex justify-center">
                      <div className="w-full max-w-3xl">
                        <NodeBubble
                          node={node}
                          depth={1}
                          expanded={expanded}
                          toggle={toggle}
                          registerRef={registerRef}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-xs text-zinc-500">
          Tip: click nodes to expand
        </div>
      </div>
    </div>
  );
};

export default MindmapBox;

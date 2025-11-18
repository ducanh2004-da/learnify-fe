// UserList.tsx (fix TypeScript error by using ListItemButton)
import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import Divider from "@mui/material/Divider";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Badge from "@mui/material/Badge";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import { useQuery } from "@tanstack/react-query";
import { chatService } from "../services/chat.service";
import type { User } from "@/types/user.type";

interface UserListProps {
  searchTerm?: string;
  itemsPerPage?: number;
  onSelectUser?: (u: User) => void;
  selectedUserId?: string | null;
  showSearch?: boolean;
  maxWidth?: number | string;
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = Math.abs(hash).toString(16).slice(0, 6).padEnd(6, "0");
  return `#${color}`;
}

function stringAvatar(name: string) {
  const parts = name.split(" ").filter(Boolean);
  const initials =
    parts.length === 0
      ? "?"
      : parts.length === 1
      ? parts[0][0]
      : parts[0][0] + parts[parts.length - 1][0];
  return {
    sx: { bgcolor: stringToColor(name) },
    children: initials.toUpperCase(),
  };
}

export default function UserList({
  searchTerm = "",
  itemsPerPage = 20,
  onSelectUser,
  selectedUserId = null,
  showSearch = false,
  maxWidth = 360,
}: UserListProps) {
  const {
    data: users = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => chatService.getAllUsers(),
    staleTime: 1000 * 60 * 5,
  });

  const filtered = React.useMemo(() => {
    const q = (searchTerm || "").trim().toLowerCase();
    const arr = (users || []).filter((u) => {
      if (!q) return true;
      return (
        (u.username || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phoneNumber || "").toLowerCase().includes(q)
      );
    });

    arr.sort((a, b) => {
      const aOnline = !!(a as any).isOnline;
      const bOnline = !!(b as any).isOnline;
      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      const an = (a.username || "").toLowerCase();
      const bn = (b.username || "").toLowerCase();
      return an.localeCompare(bn);
    });

    return arr.slice(0, itemsPerPage);
  }, [users, searchTerm, itemsPerPage]);

  if (isLoading) {
    return (
      <Box
        sx={{
          width: "100%",
          maxWidth,
          bgcolor: "background.paper",
          p: 2,
          borderRadius: 2,
        }}
      >
        <List sx={{ p: 0 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Box
              key={i}
              sx={{ display: "flex", gap: 2, alignItems: "center", py: 1 }}
            >
              <Skeleton variant="circular" width={48} height={48} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="60%" height={20} />
                <Skeleton width="40%" height={16} />
              </Box>
            </Box>
          ))}
        </List>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box
        sx={{
          width: "100%",
          maxWidth,
          bgcolor: "background.paper",
          p: 3,
          textAlign: "center",
          borderRadius: 2,
        }}
      >
        <Typography variant="body1" color="error" sx={{ mb: 1 }}>
          Không thể tải danh sách bạn bè.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth,
        bgcolor: "background.paper",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Typography variant="h6">{`Find your friends (${users.length})`}</Typography>
        <Typography variant="body2" color="text.secondary">
          {searchTerm ? "Filtered results" : "All users"}
        </Typography>
      </Box>

      <List sx={{ p: 0 }}>
        {filtered.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Không tìm thấy bạn bè.
            </Typography>
          </Box>
        ) : (
          filtered.map((u) => {
            const isSelected = selectedUserId === u.id;
            const isOnline = !!(u as any).isOnline;
            const lastMessage = (u as any).lastMessage ?? "";
            const unreadCount = Number((u as any).unreadCount ?? 0);

            return (
              <React.Fragment key={u.id}>
                {/* Use ListItem + ListItemButton to satisfy MUI TS types */}
                <ListItem disablePadding alignItems="flex-start">
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => onSelectUser?.(u)}
                    sx={{
                      px: 2,
                      py: 1,
                      display: "flex",
                      alignItems: "flex-start",
                      "&.Mui-selected": {
                        background: (theme) =>
                          `${theme.palette.primary.main}10`,
                      },
                      cursor: "pointer",
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                        variant="dot"
                        invisible={!isOnline}
                        sx={{
                          "& .MuiBadge-badge": {
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            border: "2px solid",
                            borderColor: "background.paper",
                          },
                        }}
                      >
                        {u.avatar ? (
                          <Avatar alt={u.username} src={u.avatar} />
                        ) : (
                          <Avatar
                            {...stringAvatar(u.username || u.email || "User")}
                          />
                        )}
                      </Badge>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography variant="subtitle1" noWrap>
                              {u.username || u.email || "No name"}
                            </Typography>
                            {isOnline && (
                              <Typography
                                variant="caption"
                                sx={{ color: "success.main" }}
                              >
                                • online
                              </Typography>
                            )}
                          </Box>

                          <Box sx={{ textAlign: "right" }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                            >
                              {u.updatedAt
                                ? new Date(u.updatedAt).toLocaleDateString()
                                : ""}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                          }}
                        >
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ maxWidth: "68%" }}
                          >
                            {lastMessage ||
                              (u.role ? `(${u.role})` : "Chưa có tin nhắn")}
                          </Typography>

                          <Box>
                            {unreadCount > 0 ? (
                              <Badge
                                badgeContent={unreadCount}
                                color="primary"
                              />
                            ) : null}
                          </Box>
                        </Box>
                      }
                      // <- quan trọng: render secondary wrapper bằng <div> thay vì mặc định <p>
                      secondaryTypographyProps={{ component: "div" }}
                    />
                  </ListItemButton>
                </ListItem>

                <Divider variant="inset" component="li" />
              </React.Fragment>
            );
          })
        )}
      </List>
    </Box>
  );
}

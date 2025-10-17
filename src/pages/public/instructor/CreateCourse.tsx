// CreateCourse.tsx (React + TypeScript, updated to use useMutation)
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, File as FileIcon, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { apiConfig } from "@/configs";


type CreateCourseResponse = {
  id: string;
  courseName: string;
  abstract: string;
  createdAt: string;
  updatedAt: string;
  keyLearnings?: string[];
};

type FileUploadStatus = "idle" | "uploading" | "done" | "error";

const GRAPHQL_URL = (import.meta.env.VITE_GRAPHQL_URL as string) ?? "http://localhost:10000/graphql";

// ---------------- API (axios) ----------------
async function createCourseApi(courseName: string, abstract: string, creatorId: string) {
  const mutation = `
    mutation CreateCourse($data: CreateCourseDto!) {
      createCourse(data: $data) {
        id
        courseName
        abstract
        createdAt
        updatedAt
        keyLearnings
      }
    }
  `;

  const payload = {
    query: mutation,
    variables: {
      data: { courseName, abstract, creatorId },
    },
  };

  const res = await apiConfig.post(GRAPHQL_URL, payload);
  const json = res.data;

  if (json?.errors && json.errors.length > 0) {
    throw new Error(json.errors[0]?.message || JSON.stringify(json.errors));
  }

  if (!json.data?.createCourse) {
    throw new Error("Invalid response from createCourse");
  }

  return json.data.createCourse as CreateCourseResponse;
}

// ---------------- Component ----------------
export default function CreateCourse() {
  const { user: authUser } = useAuthStore();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileUploadStatus>>({});
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // React Query mutations
  const createCourseMutation = useMutation({
    mutationFn: ({ title, description, creatorId }: { title: string; description: string; creatorId: string }) =>
      createCourseApi(title, description, creatorId),
    onError: (err: any) => {
      console.error("createCourseMutation error:", err);
    },
    onSuccess: (data) => {
      // invalidate courses list (if exists) and any course-related queries
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", data.id] });
    },
  });

  // Main handler: use react-query mutations
  async function handleCreate() {
    if (!courseTitle || !courseDescription) {
      toast.error("Vui lòng điền tiêu đề và mô tả khóa học.");
      return;
    }
    if (!authUser?.id) {
      toast.error("Vui lòng đăng nhập để tạo khóa học.");
      return;
    }


    setIsProcessing(true);
    try {
      toast.info("Đang tạo khóa học...");
      // create course via mutation
      const courseResult = await createCourseMutation.mutateAsync({
        title: courseTitle,
        description: courseDescription,
        creatorId: authUser.id,
      });

      const courseId = courseResult.id;
      setCreatedCourseId(courseId);
      toast.success(`Khóa học "${courseResult.courseName}" đã được tạo thành công!`);
    } catch (error: any) {
      console.error("Create course failed:", error);
      toast.error(error?.message || "Tạo khóa học thất bại.");
    } finally {
      setIsProcessing(false);
    }
  }

  // Render (kept same UI)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tạo Khóa Học Mới</h1>
        </div>

        <div className="">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-xl">Thông Tin Khóa Học</CardTitle>
              <CardDescription>Nhập thông tin cơ bản về khóa học</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="courseName">Tên Khóa Học *</Label>
                <Input id="courseName" placeholder="Nhập tên khóa học" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} className="text-base" disabled={isProcessing} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abstract">Mô Tả Khóa Học *</Label>
                <textarea id="abstract" placeholder="Mô tả những gì học viên sẽ học được trong khóa học này" value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)} className="w-full px-3 py-2 border border-input rounded-md bg-background text-base resize-none min-h-[120px]" disabled={isProcessing} />
              </div>

              {createdCourseId && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">✓ Course ID: <code className="font-mono">{createdCourseId}</code></p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center space-x-4 mt-8">
          <Button onClick={handleCreate} size="lg" className="bg-blue-600 hover:bg-blue-700 px-8" disabled={!courseTitle || !courseDescription || isProcessing}>
            {isProcessing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang xử lý...</>) : ("Tạo Khóa Học")}
          </Button>
        </div>

        {isProcessing && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-blue-800 text-sm">Quá trình này có thể mất vài phút. Vui lòng không đóng trang.</p>
          </div>
        )}
      </div>
    </div>
  );
}

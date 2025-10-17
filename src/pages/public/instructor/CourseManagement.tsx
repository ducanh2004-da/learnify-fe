import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { courseService } from "@/features/courses";
import { useAuthStore } from "@/stores";

// import { styled } from '@mui/material/styles';
// import Dialog from '@mui/material/Dialog';
import UploadForm from "./UploadForm";
import ViewDetailCourse from "./ViewDetailCourse";

// Local type for Course (adjust fields if your API differs)
interface Course {
  id: string;
  courseName?: string | null;
  abstract?: string | null;
  keyLearnings?: string[] | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

// const BootstrapDialog = styled(Dialog)(({ theme }) => ({
//   '& .MuiDialogContent-root': {
//     padding: theme.spacing(2),
//   },
//   '& .MuiDialogActions-root': {
//     padding: theme.spacing(1),
//   },
// }));

export default function CourseManagement() {
  const { user: authUser } = useAuthStore();

  const {
    data: courses,
    isLoading,
  } = useQuery({
    queryKey: ["instructorCourses", authUser?.id],
    queryFn: () => courseService.getCourseByUserId(authUser?.id || ""),
    enabled: !!authUser?.id,
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce user input (300ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  // Helper: normalize string for case-insensitive & diacritics-insensitive comparison
  const normalize = (s?: string | null) =>
    (s || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim();

  // Compute filtered courses (memoized)
  const filteredCourses = useMemo(() => {
    const list: Course[] = Array.isArray(courses) ? (courses as Course[]) : [];
    const q = normalize(debouncedSearch);
    if (!q) return list;

    return list.filter((c) => {
      const name = normalize(c.courseName ?? "");
      const abstract = normalize(c.abstract ?? "");
      const learnings = Array.isArray(c.keyLearnings) ? c.keyLearnings.join(" ") : "";
      const keyLearnings = normalize(learnings);

      return name.includes(q) || abstract.includes(q) || keyLearnings.includes(q);
    });
  }, [courses, debouncedSearch]);

  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Courses</h1>
            <p className="text-gray-600 text-lg">Manage and track your course content and student progress</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link to="/instructor/create-course">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create New Course
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              aria-label="Search courses"
              placeholder="Search courses by name, description or key learnings..."
              className="pl-10 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Clear button */}
            {searchTerm && (
              <button
                aria-label="Clear search"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                title="Clear"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline">All Courses</Button>
            <Button variant="outline">Published</Button>
            <Button variant="outline">Drafts</Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-3xl font-bold text-gray-900">{(courses ?? []).length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">1,247</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Course Materials</p>
                  <p className="text-3xl font-bold text-gray-900">89</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses List */}
        <div className="space-y-6">
          {(filteredCourses ?? []).map((course) => (
            <Card key={course.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{course?.courseName}</h3>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {course?.createdAt?.toString?.()}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-4 text-pretty">{course?.abstract}</p>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{(course?.keyLearnings || []).join(", ")}</span>
                      </div>
                      <span>Updated {course?.updatedAt?.toString?.()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <UploadForm courseId={course?.id} open={false} />
                    <ViewDetailCourse courseId={course?.id} open={false} />
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State (if no courses) */}
        {(filteredCourses ?? []).length === 0 && !isLoading && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Try a different search or create a new course.
              </p>
              <Link to="/instructor/create-course">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Course
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}

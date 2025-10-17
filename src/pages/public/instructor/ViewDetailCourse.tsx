import React, { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { courseService, lessonService } from "@/features/courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// MUI
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import { Book } from 'lucide-react';
import { PenTool } from 'lucide-react';
import { CircleX } from 'lucide-react';
import UploadForm from "./UploadForm";

interface UploadFormProps {
    courseId: string;
    open?: boolean;
    onClose?: () => void;
}

// Minimal shapes (adjust if your API uses different names)
interface Course {
    id: string;
    courseName?: string;
    abstract?: string;
    thumbnailUrl?: string | null;
    lessonsCount?: number;
    createdAt?: string;
}

interface Lesson {
    id: string;
    lessonName?: string;
    abstract?: string;
    duration?: number; // in minutes maybe
}

export default function ViewDetailCourse({ courseId, open = false, onClose }: UploadFormProps) {
    const [isOpen, setIsOpen] = useState(open);
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => {
        setIsOpen(false);
        if (onClose) onClose();
    }
    const queryResults = useQueries({
        queries: [{
            queryKey: ['course', courseId],
            queryFn: () => courseService.getCourseById(courseId),
            enabled: !!courseId,
        },
        {
            queryKey: ['lessons', courseId],
            queryFn: () => lessonService.getLessonsByCourseId(courseId),
            enabled: !!courseId,
        }],
        combine: (results) => {
            const [courseResult, lessonsResult] = results;
            return {
                course: courseResult.data,
                lessons: lessonsResult.data || [],
                isLoading: courseResult.isLoading || lessonsResult.isLoading,
                courseError: courseResult.error
            }
        }
    });
    const { course, lessons, isLoading } = queryResults;

    const formatDate = (iso?: string) => {
        if (!iso) return '-';
        try {
            return new Date(iso).toLocaleDateString();
        } catch {
            return iso;
        }
    };

    return (
        <>
            {/* Trigger button */}
            <Button
                variant="outlined"
                onClick={() => setIsOpen(true)}
                className="rounded-md border-gray-300 text-sm hover:bg-gray-50 transition"
            >
                View
            </Button>

            <Dialog
                open={isOpen}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                aria-labelledby="course-detail-title"
                className="text-sm"
            >
                {/* Dialog title with clean tailwind styling */}
                <DialogTitle
                    id="course-detail-title"
                    className="flex items-center justify-between px-4 py-3 border-b bg-white"
                >
                    <Typography variant="h6" className="text-base font-semibold">
                        Course Details
                    </Typography>

                    <div className="flex items-center gap-2">
                        <Button
                            aria-label="close"
                            onClick={handleClose}
                            startIcon={<CircleX />}
                            className="text-sm normal-case"
                        >
                            Close
                        </Button>
                    </div>
                </DialogTitle>

                <DialogContent dividers className="p-4 bg-slate-50">
                    {isLoading ? (
                        <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            justifyContent="center"
                            sx={{ py: 6 }}
                        >
                            <CircularProgress />
                            <Typography>Loading course details...</Typography>
                        </Stack>
                    ) : (
                        <Box
                            className="grid gap-4"
                            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '340px 1fr' }, gap: 16 }}
                        >
                            {/* Left column: visual summary */}
                            <Card className="overflow-hidden rounded-lg shadow-md border border-gray-100">
                                <CardHeader className="px-4 pt-4">
                                    <CardTitle className="text-lg font-semibold text-slate-800">{course?.courseName || 'Untitled course'}</CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="flex flex-col gap-3">
                                        <div className="w-full h-44 rounded-md overflow-hidden bg-gray-100">
                                            <img
                                                src='https://via.placeholder.com/640x360?text=Course+Image'
                                                alt={course?.courseName || 'course image'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        <Typography variant="body2" className="min-h-[48px] text-sm text-slate-700">
                                            {course?.abstract || 'No description provided.'}
                                        </Typography>

                                        <Stack direction="row" spacing={1} alignItems="center" className="mt-2">
                                            <Chip label={`${lessons.length} lessons`} icon={<Book />} size="small" className="bg-indigo-50 text-indigo-700" />
                                            <Typography variant="caption" className="text-xs text-slate-500">
                                                Created: {formatDate(course?.createdAt)}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Right column: lessons list */}
                            <Box>
                                <Typography variant="subtitle1" sx={{ mb: 1 }} className="text-sm font-medium text-slate-800 mb-2">
                                    Danh sách Bài học
                                </Typography>

                                <Card className="rounded-lg shadow-sm border border-gray-100">
                                    <CardContent className="p-0">
                                        {lessons.length === 0 ? (
                                            <div className="p-4">
                                                <Typography className="text-sm text-slate-600">No lessons available.</Typography>
                                            </div>
                                        ) : (
                                            <List disablePadding>
                                                {lessons.map((lesson, idx) => (
                                                    <React.Fragment key={lesson.id}>
                                                        <ListItem
                                                            alignItems="flex-start"
                                                            sx={{ py: 2 }}
                                                            className="px-4 py-3 hover:bg-white/50 transition rounded-md"
                                                        >
                                                            <ListItemAvatar>
                                                                <Avatar className="bg-indigo-50 text-indigo-600">
                                                                    <Book />
                                                                </Avatar>
                                                            </ListItemAvatar>

                                                            <ListItemText
                                                                primary={
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <Typography className="font-semibold text-sm text-slate-800">{lesson.lessonName}</Typography>
                                                                        {lesson?.createdAt ? (
                                                                            <span className="text-xs text-slate-500">{formatDate(lesson?.createdAt)}</span>
                                                                        ) : null}
                                                                    </div>
                                                                }
                                                                secondary={
                                                                    <>
                                                                        <Typography variant="body2" className="mt-1 text-sm text-slate-600">
                                                                            {lesson.abstract || '—'}
                                                                        </Typography>
                                                                        {/** createdAt optional */}
                                                                        {'createdAt' in lesson && (lesson as any).createdAt ? (
                                                                            <Typography variant="caption" className="text-xs text-slate-500 mt-1 block">
                                                                                Created: {formatDate((lesson as any).createdAt)}
                                                                            </Typography>
                                                                        ) : null}
                                                                    </>
                                                                }
                                                            />
                                                        </ListItem>

                                                        {idx < lessons.length - 1 && <Divider component="li" className="mx-4" />}
                                                    </React.Fragment>
                                                ))}
                                            </List>
                                        )}
                                    </CardContent>
                                </Card>
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions className="px-4 py-3 bg-white border-t">
                    <Button onClick={handleClose} className="text-sm normal-case">
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

import React, { useState } from 'react';
import { BookOpen, Award, Clock, TrendingUp, Calendar, Star, ChevronRight, Settings, Bell, LogOut } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services';
import { useAuthStore } from '@/stores';
import { User } from '@/features/classroom/types/user.type';
import { data } from 'react-router-dom';
import { CompleteCourse } from '@/features/profile/types/completeCourse.type';
import { InProgressCourse } from '@/features/profile/types/inProgressCourse.type';

const defaultStats = {
    coursesCompleted: 0,
    inProgress: 0,
    totalHours: 0,
    certificates: 0
};

export default function ProfilePage() {
    const { user: authUser, logout } = useAuthStore()
    const [activeTab, setActiveTab] = useState('ongoing');

    const { 
        data: user, 
        isLoading, 
        isError,
        isFetching 
      } = useQuery<User>({
        queryKey: ['getUserId', authUser?.id],
        queryFn: () => profileService.getUserById(authUser?.id || null),
        enabled: !!authUser?.id,
      });

    const {
        data: completedCourses,
    } = useQuery<CompleteCourse>({
        queryKey: ['getCompletedCourses', authUser?.id],
        queryFn: () => profileService.getCompletedCourses(authUser?.id || ''),
        enabled: !!authUser?.id,
    });

    const {
        data: inProgressCourses,
    } = useQuery<InProgressCourse>({
        queryKey: ['getInProgressCourses', authUser?.id],
        queryFn: () => profileService.getInProgressCourses(authUser?.id || ''),
        enabled: !!authUser?.id,
    });

    const courses = {
        ongoing: [
            {
                id: 1,
                title: "Advanced React & TypeScript",
                instructor: "John Doe",
                progress: 65,
                thumbnail: "bg-gradient-to-br from-blue-500 to-purple-600",
                duration: "8 hours left",
                nextLesson: "State Management with Context"
            },
            {
                id: 2,
                title: "UI/UX Design Mastery",
                instructor: "Emma Wilson",
                progress: 45,
                thumbnail: "bg-gradient-to-br from-pink-500 to-rose-600",
                duration: "12 hours left",
                nextLesson: "Design Systems Fundamentals"
            },
            {
                id: 3,
                title: "Machine Learning Basics",
                instructor: "Dr. Michael Chen",
                progress: 30,
                thumbnail: "bg-gradient-to-br from-green-500 to-teal-600",
                duration: "18 hours left",
                nextLesson: "Neural Networks Introduction"
            }
        ],
        completed: [
            {
                id: 4,
                title: "JavaScript ES6+",
                instructor: "Alex Turner",
                completedDate: "Sep 2024",
                thumbnail: "bg-gradient-to-br from-yellow-500 to-orange-600",
                rating: 5,
                certificate: true
            },
            {
                id: 5,
                title: "Web Design Fundamentals",
                instructor: "Lisa Park",
                completedDate: "Aug 2024",
                thumbnail: "bg-gradient-to-br from-indigo-500 to-blue-600",
                rating: 5,
                certificate: true
            }
        ]
    };

    return (
        <section className="min-h-screen min-w-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="back-btn">
                {
                    (user?.role.trim().toLocaleLowerCase() == 'instructor' && user?.role.trim().toLocaleLowerCase() != 'user') ? (
                        <a href="/instructor" className="text-blue-600 hover:underline text-xl">
                            <button className='cursor-pointer bg-blue-600 text-white rounded-full p-5'>← Back to Home</button>
                            </a>
                    ) : (
                        <a href="/" className="text-blue-600 hover:underline text-xl">
                            <button className='cursor-pointer bg-blue-600 text-white rounded-full p-5'>← Back to Home</button>
                        </a>
                    )
                }
            </div>
            {isLoading && (
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}
            {isError && (
                <div className="flex justify-center items-center h-screen">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline"> Failed to load profile data.</span>
                    </div>
                </div>
            )}
            {!isLoading && !isError && (
            <div className="max-w-8xl px-6 py-8 mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
                    <div className="flex gap-3">
                        <button className="p-2 hover:bg-white rounded-lg transition-all">
                            <Bell className="w-5 h-5 text-slate-600" />
                        </button>
                        <button className="p-2 hover:bg-white rounded-lg transition-all">
                            <Settings className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar - User Info */}
                    <div className="lg:w-150 space-y-6">
                        {/* Avatar Card */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
                            <div className="p-6 -mt-16">
                                <div className="flex justify-center mb-4">
                                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-4 ring-white">
                                        {user?.username.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-slate-800 mb-1">{user?.username}</h2>
                                    <p className="text-slate-500 text-base mb-1">{user?.email}</p>
                                    <p className="text-slate-500 text-sm mb-1">{user?.phoneNumber}</p>
                                    <span className="inline-block px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-full font-medium mt-2">
                                        {user?.role}
                                    </span>
                                    <p className="text-slate-400 text-sm mt-3">
                                        <Calendar className="w-3 h-3 inline mr-1" />
                                        Member since {user?.createdAt}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <Award className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-2xl font-bold text-slate-800">{completedCourses?.count}</p>
                                <p className="text-sm text-slate-500">Completed</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <BookOpen className="w-5 h-5 text-purple-600" />
                                </div>
                                <p className="text-2xl font-bold text-slate-800">{inProgressCourses?.count}</p>
                                <p className="text-sm text-slate-500">In Progress</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <Clock className="w-5 h-5 text-green-600" />
                                </div>
                                <p className="text-2xl font-bold text-slate-800">0</p>
                                <p className="text-sm text-slate-500">Hours Learned</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <TrendingUp className="w-5 h-5 text-orange-600" />
                                </div>
                                <p className="text-2xl font-bold text-slate-800">0</p>
                                <p className="text-sm text-slate-500">Certificates</p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl p-4 shadow-md">
                            <h3 className="font-semibold text-slate-800 mb-3 text-base">Quick Actions</h3>
                            <div className="space-y-2">
                                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                    <span className="text-base text-slate-600">My Certificates</span>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                    <span className="text-base text-slate-600">Learning Path</span>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-between group text-red-600">
                                    <button onClick={() => {
                                        logout();
                                        window.location.href = '/';
                                    }} className="text-base">Sign Out</button>
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Courses */}
                    <div className="flex-1">
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            {/* Tabs */}
                            <div className="flex gap-2 mb-6 border-b border-slate-200">
                                <button
                                    onClick={() => setActiveTab('ongoing')}
                                    className={`px-6 py-3 font-medium text-base transition-all relative ${activeTab === 'ongoing'
                                            ? 'text-blue-600'
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    Ongoing Courses
                                    {activeTab === 'ongoing' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('completed')}
                                    className={`px-6 py-3 font-medium text-base transition-all relative ${activeTab === 'completed'
                                            ? 'text-blue-600'
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    Completed
                                    {activeTab === 'completed' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                                    )}
                                </button>
                            </div>

                            {/* Course Cards */}
                            <div className="space-y-4">
                                {activeTab === 'ongoing' && 
                                (inProgressCourses?.count == 0 ? (
                                    <div className="text-center text-slate-500 py-10">
                                        You have no Ongoing Courses. Start learning today!
                                    </div>
                                ):
                                inProgressCourses?.courses.map((course) => (
                                    <div key={course.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all group cursor-pointer">
                                        <div className="flex gap-4">
                                            <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 shadow-md"></div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-slate-800 text-xl group-hover:text-blue-600 transition-colors">
                                                            {course?.courseName}
                                                        </h3>
                                                        <p className="text-base text-slate-500">{course?.abstract}</p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                                <div className="mb-3">
                                                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                                                        <span>Progress</span>
                                                        <span className="font-semibold">{inProgressCourses.progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all"
                                                            style={{ width: `${inProgressCourses.progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-500">
                                                        <Clock className="w-3 h-3 inline mr-1" />
                                                    </span>
                                                    <button className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm rounded-full hover:shadow-md transition-all">
                                                        Continue Learning
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )))}

                                {activeTab === 'completed' && 
                                (completedCourses?.count == 0 ? (
                                    <div className="text-center text-slate-500 py-10">
                                        You have no Completed Course. Start learning today!
                                    </div>
                                ):
                                completedCourses?.courses.map((course) => (
                                    <div key={course.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all group cursor-pointer">
                                        <div className="flex gap-4">
                                            <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex-shrink-0 shadow-md relative">
                                                <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                                                    <Award className="w-10 h-10 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-slate-800 text-xl group-hover:text-blue-600 transition-colors">
                                                            {course.courseName}
                                                        </h3>
                                                        <p className="text-base text-slate-500">{course.abstract}</p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                                <div className="flex items-center gap-1 mb-3">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                    ))}
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-500">
                                                        <button>View Course</button>
                                                    </span>
                                                        <button className="px-4 py-1.5 bg-gradient-to-r from-green-600 to-teal-600 text-white text-sm rounded-full hover:shadow-md transition-all">
                                                            View Certificate
                                                        </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </section>
            
    )
}
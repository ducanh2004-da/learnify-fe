import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Upload, Users, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
            Create Amazing Courses
            <span className="text-blue-600 block">For Your Students</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 text-pretty max-w-2xl mx-auto leading-relaxed">
            Upload your Word and PDF documents to create engaging courses. Our platform makes it easy to share knowledge
            and track student progress.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Link bọc Button để navigate đến trang tạo khoá học */}
            <Link to="/instructor/create-course" aria-label="Create your first course">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
                <Upload className="mr-2 h-5 w-5" />
                Create Your First Course
              </Button>
            </Link>

            {/* Watch Demo (nếu bạn muốn mở modal, thay bằng onClick handler) */}
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3 bg-transparent"
              aria-label="Watch demo"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Teach</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Powerful tools designed specifically for educators to create, manage, and deliver exceptional learning
              experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Easy File Upload</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base leading-relaxed">
                  Simply drag and drop your Word documents and PDFs. Our platform automatically processes and organizes
                  your content.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Student Management</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base leading-relaxed">
                  Track student progress, manage enrollments, and communicate effectively with your learning community.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Analytics & Insights</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base leading-relaxed">
                  Get detailed insights into course performance, student engagement, and learning outcomes with
                  comprehensive analytics.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold text-white mb-6 text-balance">Ready to Transform Your Teaching?</h2>
          <p className="text-blue-100 text-lg mb-8 text-pretty leading-relaxed">
            Join thousands of educators who are already creating amazing courses with Learnify.
          </p>

          {/* Dùng className để style trực tiếp thay vì variant không rõ */}
          <Link to="/instructor/create-course" aria-label="Start creating today">
            <Button size="lg" className="text-lg px-8 py-3 bg-white text-blue-600 hover:bg-gray-100">
              Start Creating Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold text-white">Learnify</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Empowering educators to create exceptional learning experiences.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Platform</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/instructor/create-course" className="hover:text-blue-400 transition-colors">Create Course</Link>
                </li>
                <li>
                  <Link to="/instructor/courses" className="hover:text-blue-400 transition-colors">Manage Courses</Link>
                </li>
                <li>
                  <Link to="/instructor/analytics" className="hover:text-blue-400 transition-colors">Analytics</Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/help" className="hover:text-blue-400 transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
                <li><Link to="/community" className="hover:text-blue-400 transition-colors">Community</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-blue-400 transition-colors">About</Link></li>
                <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">© 2025 Learnify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

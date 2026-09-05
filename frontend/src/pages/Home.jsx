import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Home() {
  const scrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 space-y-16">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6 pt-4 sm:pt-8">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
          Learning & Performance Management System
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          C4GT KIET HUB
        </h1>

        <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
          A centralized learning and performance management system for students, Team Leads, and Admins.
          Designed to coordinate cohort workflows, track assignment progress, access essential learning
          resources, and support continuous technical development.
        </p>

        <div className="flex items-center justify-center gap-4 pt-2">
          <Button size="lg" onClick={scrollToFeatures} className="cursor-pointer">
            Explore Learning
          </Button>
          <Button size="lg" variant="outline" onClick={scrollToFeatures} className="cursor-pointer">
            Get Started
          </Button>
        </div>
      </section>

      {/* Student-Facing Core Features Section */}
      <section id="features" className="space-y-8 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Platform Capabilities
          </h2>
          <p className="text-sm text-gray-500">
            Structured tools designed to support your learning journey and milestone delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="hover:border-gray-300 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Complete Assignments on Time</CardTitle>
              <CardDescription>Structured deliverables and deadline tracking.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Submit project tasks against defined milestones and maintain consistent progress throughout your cohort.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-gray-300 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Access Learning Resources</CardTitle>
              <CardDescription>Curated technical documentation and guides.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Browse reference materials, implementation guides, and tools selected to support your technical assignments.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-gray-300 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Track Your Progress</CardTitle>
              <CardDescription>Real-time status updates and milestone clarity.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Monitor assignment review stages, received feedback, and milestone completions from a unified view.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-gray-300 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Improve Your Performance</CardTitle>
              <CardDescription>Derived performance evaluation and feedback.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Build practical open-source engineering competencies through consistent task execution and mentorship review.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

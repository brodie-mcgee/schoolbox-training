"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle,
  Play,
  ChevronRight,
  ChevronLeft,
  Award,
} from "lucide-react";
import VideoPlayer from "@/components/training/VideoPlayer";
import QuizComponent, { QuizQuestion } from "@/components/training/QuizComponent";
import { toast } from "sonner";

interface Lesson {
  id: string;
  title: string;
  content?: string;
  video_url?: string;
  duration?: number;
  questions?: QuizQuestion[];
}

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  lessons: Lesson[];
  status: string;
  pass_score?: number;
  quiz_required?: boolean;
  thumbnail?: string;
  created_at: string;
  created_by?: string;
}

interface LessonProgress {
  [lessonId: string]: boolean;
}

export default function TrainingModuleDetailPage() {
  const params = useParams();
  const moduleId = params.id as string;

  const [module, setModule] = useState<TrainingModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress>({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const [attemptsUsed, setAttemptsUsed] = useState<Record<string, number>>({});

  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    async function fetchModule() {
      try {
        setLoading(true);
        const response = await fetch(`/api/training/${moduleId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to load training module");
        }
        const data = await response.json();
        const moduleData = data.module;

        if (!moduleData) {
          setError("Training module not found");
          return;
        }

        setModule(moduleData);

        // Set first lesson as active if lessons exist
        if (moduleData.lessons.length > 0) {
          setActiveLesson(moduleData.lessons[0].id);
        }

        // Initialize progress for all lessons
        const progress: LessonProgress = {};
        moduleData.lessons.forEach((lesson: Lesson) => {
          progress[lesson.id] = false;
        });
        setLessonProgress(progress);
      } catch (err: unknown) {
        console.error("Error fetching module:", err);
        setError(err instanceof Error ? err.message : "Failed to load training module");
      } finally {
        setLoading(false);
      }
    }

    if (moduleId) {
      fetchModule();
    }
  }, [moduleId]);

  const handleStartModule = async () => {
    setIsStarted(true);
    if (module && module.lessons.length > 0) {
      setActiveLesson(module.lessons[0].id);
    }
    // Record start in database
    try {
      await fetch(`/api/training/${moduleId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
    } catch (err) {
      console.error("Failed to record module start:", err);
    }
  };

  const handleLessonComplete = async (lessonId: string) => {
    const updatedProgress = { ...lessonProgress, [lessonId]: true };
    setLessonProgress(updatedProgress);

    // Calculate overall progress
    const completedCount = Object.values(updatedProgress).filter(Boolean).length;
    const newProgress = Math.round((completedCount / (module?.lessons.length || 1)) * 100);
    setOverallProgress(newProgress);

    if (newProgress === 100) {
      toast.success("Congratulations! You've completed this training module.");
      // Record completion in database
      try {
        await fetch(`/api/training/${moduleId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete" }),
        });
      } catch (err) {
        console.error("Failed to record module completion:", err);
      }
    }

    // Move to next lesson if available
    if (module) {
      const currentIndex = module.lessons.findIndex((l) => l.id === lessonId);
      if (currentIndex < module.lessons.length - 1) {
        setActiveLesson(module.lessons[currentIndex + 1].id);
      }
    }
  };

  const handleQuizSubmit = (
    lessonId: string,
    answers: Record<string, any>,
    score: number,
    passed: boolean
  ) => {
    setQuizScores((prev) => ({ ...prev, [lessonId]: score }));
    setAttemptsUsed((prev) => ({ ...prev, [lessonId]: (prev[lessonId] || 0) + 1 }));

    const passScore = module?.pass_score ?? 80;

    if (passed) {
      toast.success(`Great job! You scored ${score}% and passed this lesson.`);
      handleLessonComplete(lessonId);
    } else {
      toast.error(`Score ${score}% - please try again to reach at least ${passScore}%.`);
    }
  };

  const handleVideoComplete = (lessonId: string) => {
    // Auto-complete lesson if no quiz required
    const lesson = module?.lessons.find((l) => l.id === lessonId);
    if (!lesson?.questions?.length || !(module?.quiz_required ?? true)) {
      handleLessonComplete(lessonId);
    }
  };

  const goToPreviousLesson = () => {
    if (!module || !activeLesson) return;
    const currentIndex = module.lessons.findIndex((l) => l.id === activeLesson);
    if (currentIndex > 0) {
      setActiveLesson(module.lessons[currentIndex - 1].id);
    }
  };

  const goToNextLesson = () => {
    if (!module || !activeLesson) return;
    const currentIndex = module.lessons.findIndex((l) => l.id === activeLesson);
    if (currentIndex < module.lessons.length - 1) {
      setActiveLesson(module.lessons[currentIndex + 1].id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/training"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Training
          </Link>
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || "Training Module Not Found"}
            </h2>
            <p className="text-gray-500 mb-6">
              The training module you&apos;re looking for doesn&apos;t exist or may have been removed.
            </p>
            <Link
              href="/training"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              View All Training Modules
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeLessonData = module.lessons.find((l) => l.id === activeLesson);
  const passScore = module.pass_score ?? 80;
  const quizRequired = module.quiz_required ?? true;
  const lessonHasQuiz = !!(activeLessonData?.questions?.length);
  const currentLessonIndex = module.lessons.findIndex((l) => l.id === activeLesson);
  const isFirstLesson = currentLessonIndex === 0;
  const isLastLesson = currentLessonIndex === module.lessons.length - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/training" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">{module.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {module.duration_minutes || 0} minutes
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {module.lessons.length} lessons
                </span>
              </div>
            </div>
            {isStarted && (
              <div className="flex items-center gap-2">
                {overallProgress === 100 ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completed
                  </span>
                ) : (
                  <>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{overallProgress}%</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isStarted ? (
          /* Module Overview - Before Starting */
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {module.thumbnail && (
              <div className="aspect-video bg-gray-100">
                <img
                  src={module.thumbnail}
                  alt={module.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Module</h2>
              <div
                className="prose prose-gray max-w-none mb-6"
                dangerouslySetInnerHTML={{ __html: module.description || "No description available" }}
              />

              {module.lessons.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Lessons in this module:</h3>
                  <div className="space-y-2">
                    {module.lessons.map((lesson, idx) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                          {idx + 1}
                        </div>
                        <span className="text-gray-700">{lesson.title}</span>
                        {lesson.duration && (
                          <span className="text-sm text-gray-500 ml-auto">
                            {lesson.duration} min
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleStartModule}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-5 h-5" />
                Start This Module
              </button>
            </div>
          </div>
        ) : (
          /* Active Learning View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar - Lesson List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">Lessons</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {module.lessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        activeLesson === lesson.id
                          ? "bg-purple-50 border-l-4 border-purple-600"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            lessonProgress[lesson.id]
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {lessonProgress[lesson.id] ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-medium">{idx + 1}</span>
                          )}
                        </div>
                        <div>
                          <h3
                            className={`font-medium ${
                              activeLesson === lesson.id
                                ? "text-purple-700"
                                : "text-gray-900"
                            }`}
                          >
                            {lesson.title}
                          </h3>
                          {lesson.duration && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              {lesson.duration} minutes
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {activeLessonData && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {activeLessonData.title}
                  </h2>

                  {/* Video Player */}
                  {activeLessonData.video_url && (
                    <div className="mb-6">
                      <VideoPlayer
                        videoUrl={activeLessonData.video_url}
                        title={activeLessonData.title}
                        onComplete={() => handleVideoComplete(activeLessonData.id)}
                      />
                    </div>
                  )}

                  {/* Lesson Content */}
                  {activeLessonData.content && (
                    <div
                      className="prose prose-gray max-w-none mb-6"
                      dangerouslySetInnerHTML={{ __html: activeLessonData.content }}
                    />
                  )}

                  {!activeLessonData.video_url && !activeLessonData.content && (
                    <p className="text-gray-500 italic mb-6">
                      No additional content available for this lesson.
                    </p>
                  )}

                  {/* Quiz */}
                  {lessonHasQuiz && quizRequired && (
                    <div className="mb-6">
                      <QuizComponent
                        questions={activeLessonData.questions!}
                        passScore={passScore}
                        onSubmit={(answers, score, passed) =>
                          handleQuizSubmit(activeLessonData.id, answers, score, passed)
                        }
                        attemptsUsed={attemptsUsed[activeLessonData.id] || 0}
                        maxAttempts={MAX_ATTEMPTS}
                        disabled={lessonProgress[activeLessonData.id]}
                        previousScore={quizScores[activeLessonData.id]}
                      />
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={goToPreviousLesson}
                      disabled={isFirstLesson}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    {!lessonHasQuiz || !quizRequired ? (
                      <button
                        onClick={() => handleLessonComplete(activeLessonData.id)}
                        disabled={lessonProgress[activeLessonData.id]}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                          lessonProgress[activeLessonData.id]
                            ? "bg-green-600 text-white"
                            : "bg-purple-600 hover:bg-purple-700 text-white"
                        }`}
                      >
                        {lessonProgress[activeLessonData.id] ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Completed
                          </>
                        ) : (
                          "Mark as Complete"
                        )}
                      </button>
                    ) : (
                      <div className="text-sm text-gray-500">
                        {lessonProgress[activeLessonData.id]
                          ? "Lesson completed!"
                          : "Complete the quiz to continue"}
                      </div>
                    )}

                    <button
                      onClick={goToNextLesson}
                      disabled={isLastLesson}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

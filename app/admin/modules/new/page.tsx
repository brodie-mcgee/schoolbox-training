"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  X,
  Video,
  FileQuestion,
  GripVertical,
  Clock,
  Target,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface Lesson {
  id: string;
  title: string;
  type: "video" | "quiz" | "content";
  content: string;
  duration_minutes?: number;
  questions?: QuizQuestion[];
}

interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple_choice" | "true_false";
  options?: string[];
  correct_answer: string | number;
}

const CATEGORIES = [
  "Compliance",
  "Safety",
  "Professional Development",
  "Technology",
  "Leadership",
  "Onboarding",
  "Other",
];

export default function NewModulePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    status: "draft" as "draft" | "published" | "archived",
    duration_minutes: 0,
    pass_score: 80,
    max_attempts: 3,
    lessons: [] as Lesson[],
  });

  function generateId() {
    return `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function addLesson(type: Lesson["type"]) {
    const newLesson: Lesson = {
      id: generateId(),
      title: "",
      type,
      content: "",
      duration_minutes: type === "video" ? 5 : 0,
      questions: type === "quiz" ? [] : undefined,
    };
    setFormData({
      ...formData,
      lessons: [...formData.lessons, newLesson],
    });
  }

  function updateLesson(index: number, updates: Partial<Lesson>) {
    const newLessons = [...formData.lessons];
    newLessons[index] = { ...newLessons[index], ...updates };
    setFormData({ ...formData, lessons: newLessons });
  }

  function removeLesson(index: number) {
    setFormData({
      ...formData,
      lessons: formData.lessons.filter((_, i) => i !== index),
    });
  }

  function moveLesson(index: number, direction: "up" | "down") {
    const newLessons = [...formData.lessons];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLessons.length) return;
    [newLessons[index], newLessons[targetIndex]] = [
      newLessons[targetIndex],
      newLessons[index],
    ];
    setFormData({ ...formData, lessons: newLessons });
  }

  function addQuestion(lessonIndex: number) {
    const lesson = formData.lessons[lessonIndex];
    if (lesson.type !== "quiz") return;

    const newQuestion: QuizQuestion = {
      id: `q_${Date.now()}`,
      question: "",
      type: "multiple_choice",
      options: ["", "", "", ""],
      correct_answer: 0,
    };

    updateLesson(lessonIndex, {
      questions: [...(lesson.questions || []), newQuestion],
    });
  }

  function updateQuestion(
    lessonIndex: number,
    questionIndex: number,
    updates: Partial<QuizQuestion>
  ) {
    const lesson = formData.lessons[lessonIndex];
    if (!lesson.questions) return;

    const newQuestions = [...lesson.questions];
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      ...updates,
    };
    updateLesson(lessonIndex, { questions: newQuestions });
  }

  function removeQuestion(lessonIndex: number, questionIndex: number) {
    const lesson = formData.lessons[lessonIndex];
    if (!lesson.questions) return;

    updateLesson(lessonIndex, {
      questions: lesson.questions.filter((_, i) => i !== questionIndex),
    });
  }

  // Calculate total duration from lessons
  const totalDuration = formData.lessons.reduce(
    (sum, lesson) => sum + (lesson.duration_minutes || 0),
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          duration_minutes: totalDuration || formData.duration_minutes,
        }),
      });

      if (response.ok) {
        toast.success("Module created successfully");
        router.push("/admin/modules");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create module");
      }
    } catch (error) {
      console.error("Failed to create module:", error);
      toast.error("Failed to create module");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/modules"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Module</h1>
          <p className="text-gray-600">
            Build a training module with lessons and quizzes
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Module Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Module Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Workplace Safety Fundamentals"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe what staff will learn in this module..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as typeof formData.status,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pass Score (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.pass_score}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pass_score: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formData.max_attempts}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_attempts: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lessons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Lessons</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addLesson("video")}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    Add Video
                  </button>
                  <button
                    type="button"
                    onClick={() => addLesson("content")}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    Add Content
                  </button>
                  <button
                    type="button"
                    onClick={() => addLesson("quiz")}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <FileQuestion className="w-4 h-4" />
                    Add Quiz
                  </button>
                </div>
              </div>

              {formData.lessons.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <BookOpen className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">
                    No lessons yet. Add video lessons, content pages, or quizzes
                    using the buttons above.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-200">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {lesson.type === "video" && (
                            <Video className="w-4 h-4 text-blue-500" />
                          )}
                          {lesson.type === "content" && (
                            <BookOpen className="w-4 h-4 text-green-500" />
                          )}
                          {lesson.type === "quiz" && (
                            <FileQuestion className="w-4 h-4 text-purple-500" />
                          )}
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {lesson.type}
                          </span>
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveLesson(index, "up")}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveLesson(index, "down")}
                            disabled={index === formData.lessons.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLesson(index)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lesson Title
                          </label>
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) =>
                              updateLesson(index, { title: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="e.g., Introduction to Safety"
                          />
                        </div>

                        {lesson.type === "video" && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Video URL (YouTube, Vimeo, or MP4)
                              </label>
                              <input
                                type="url"
                                value={lesson.content}
                                onChange={(e) =>
                                  updateLesson(index, { content: e.target.value })
                                }
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="https://youtube.com/watch?v=..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (minutes)
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={lesson.duration_minutes || 0}
                                onChange={(e) =>
                                  updateLesson(index, {
                                    duration_minutes:
                                      parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            </div>
                          </>
                        )}

                        {lesson.type === "content" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Content (Markdown supported)
                            </label>
                            <textarea
                              value={lesson.content}
                              onChange={(e) =>
                                updateLesson(index, { content: e.target.value })
                              }
                              rows={6}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                              placeholder="# Lesson Content&#10;&#10;Write your lesson content here..."
                            />
                          </div>
                        )}

                        {lesson.type === "quiz" && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="block text-sm font-medium text-gray-700">
                                Questions ({lesson.questions?.length || 0})
                              </label>
                              <button
                                type="button"
                                onClick={() => addQuestion(index)}
                                className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                              >
                                <Plus className="w-3 h-3" />
                                Add Question
                              </button>
                            </div>

                            {lesson.questions?.map((q, qIndex) => (
                              <div
                                key={q.id}
                                className="p-4 bg-gray-50 rounded-lg space-y-3"
                              >
                                <div className="flex items-start justify-between">
                                  <span className="text-sm font-medium text-gray-600">
                                    Question {qIndex + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeQuestion(index, qIndex)
                                    }
                                    className="p-1 text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>

                                <input
                                  type="text"
                                  value={q.question}
                                  onChange={(e) =>
                                    updateQuestion(index, qIndex, {
                                      question: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  placeholder="Enter your question..."
                                />

                                <div className="grid grid-cols-2 gap-2">
                                  {q.options?.map((opt, optIndex) => (
                                    <div
                                      key={optIndex}
                                      className="flex items-center gap-2"
                                    >
                                      <input
                                        type="radio"
                                        name={`correct_${q.id}`}
                                        checked={q.correct_answer === optIndex}
                                        onChange={() =>
                                          updateQuestion(index, qIndex, {
                                            correct_answer: optIndex,
                                          })
                                        }
                                        className="text-purple-600"
                                      />
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const newOptions = [
                                            ...(q.options || []),
                                          ];
                                          newOptions[optIndex] = e.target.value;
                                          updateQuestion(index, qIndex, {
                                            options: newOptions,
                                          });
                                        }}
                                        className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder={`Option ${optIndex + 1}`}
                                      />
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500">
                                  Select the radio button next to the correct
                                  answer
                                </p>
                              </div>
                            ))}

                            {(!lesson.questions ||
                              lesson.questions.length === 0) && (
                              <p className="text-sm text-gray-500 text-center py-4">
                                No questions yet. Click &quot;Add Question&quot;
                                to get started.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Summary
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Lessons</p>
                    <p className="font-semibold text-gray-900">
                      {formData.lessons.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Duration</p>
                    <p className="font-semibold text-gray-900">
                      {totalDuration} minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pass Score</p>
                    <p className="font-semibold text-gray-900">
                      {formData.pass_score}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Max Attempts</p>
                    <p className="font-semibold text-gray-900">
                      {formData.max_attempts}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h2>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Saving..." : "Create Module"}
                </button>

                <Link
                  href="/admin/modules"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

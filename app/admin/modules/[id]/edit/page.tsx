"use client";

import { useState, useEffect, use } from "react";
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
  Upload,
  CheckSquare,
  ToggleLeft,
  Type,
  ListChecks,
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
  type: "multiple_choice" | "true_false" | "short_answer" | "multi_select" | "file_upload";
  options?: string[];
  correct_answer?: string | number | number[];
  required?: boolean;
  hint?: string;
  accepted_file_types?: string[];
  max_file_size_mb?: number;
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

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice", icon: ListChecks, description: "Single answer from options" },
  { value: "true_false", label: "True/False", icon: ToggleLeft, description: "True or false question" },
  { value: "short_answer", label: "Short Answer", icon: Type, description: "Text input response" },
  { value: "multi_select", label: "Multi-Select", icon: CheckSquare, description: "Multiple correct answers" },
  { value: "file_upload", label: "File Upload", icon: Upload, description: "Upload certificate/document" },
];

export default function EditModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadModule();
  }, [id]);

  async function loadModule() {
    try {
      const response = await fetch(`/api/admin/modules/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          title: data.module.title || "",
          description: data.module.description || "",
          category: data.module.category || "",
          status: data.module.status || "draft",
          duration_minutes: data.module.duration_minutes || 0,
          pass_score: data.module.pass_score || 80,
          max_attempts: data.module.max_attempts || 3,
          lessons: data.module.lessons || [],
        });
      } else {
        toast.error("Module not found");
        router.push("/admin/modules");
      }
    } catch (error) {
      console.error("Failed to load module:", error);
      toast.error("Failed to load module");
    } finally {
      setLoading(false);
    }
  }

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

  function addQuestion(lessonIndex: number, questionType: QuizQuestion["type"]) {
    const lesson = formData.lessons[lessonIndex];
    if (lesson.type !== "quiz") return;

    const baseQuestion = {
      id: `q_${Date.now()}`,
      question: "",
      type: questionType,
      required: true,
    };

    let newQuestion: QuizQuestion;

    switch (questionType) {
      case "multiple_choice":
        newQuestion = {
          ...baseQuestion,
          options: ["", "", "", ""],
          correct_answer: 0,
        };
        break;
      case "true_false":
        newQuestion = {
          ...baseQuestion,
          options: ["True", "False"],
          correct_answer: 0,
        };
        break;
      case "short_answer":
        newQuestion = {
          ...baseQuestion,
          correct_answer: "",
          hint: "",
        };
        break;
      case "multi_select":
        newQuestion = {
          ...baseQuestion,
          options: ["", "", "", ""],
          correct_answer: [],
        };
        break;
      case "file_upload":
        newQuestion = {
          ...baseQuestion,
          accepted_file_types: [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"],
          max_file_size_mb: 10,
        };
        break;
      default:
        newQuestion = baseQuestion as QuizQuestion;
    }

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

  function toggleMultiSelectAnswer(lessonIndex: number, questionIndex: number, optionIndex: number) {
    const lesson = formData.lessons[lessonIndex];
    if (!lesson.questions) return;

    const question = lesson.questions[questionIndex];
    const currentAnswers = (question.correct_answer as number[]) || [];

    const newAnswers = currentAnswers.includes(optionIndex)
      ? currentAnswers.filter(a => a !== optionIndex)
      : [...currentAnswers, optionIndex];

    updateQuestion(lessonIndex, questionIndex, { correct_answer: newAnswers });
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
      const response = await fetch(`/api/admin/modules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          duration_minutes: totalDuration || formData.duration_minutes,
        }),
      });

      if (response.ok) {
        toast.success("Module updated successfully");
        router.push("/admin/modules");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update module");
      }
    } catch (error) {
      console.error("Failed to update module:", error);
      toast.error("Failed to update module");
    } finally {
      setSaving(false);
    }
  }

  function renderQuestionEditor(lesson: Lesson, lessonIndex: number, q: QuizQuestion, qIndex: number) {
    const questionTypeInfo = QUESTION_TYPES.find(qt => qt.value === q.type);
    const Icon = questionTypeInfo?.icon || FileQuestion;

    return (
      <div key={q.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-600">
              Question {qIndex + 1} - {questionTypeInfo?.label || q.type}
            </span>
          </div>
          <button
            type="button"
            onClick={() => removeQuestion(lessonIndex, qIndex)}
            className="p-1 text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          type="text"
          value={q.question}
          onChange={(e) =>
            updateQuestion(lessonIndex, qIndex, { question: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter your question..."
        />

        {/* Multiple Choice */}
        {q.type === "multiple_choice" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {q.options?.map((opt, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct_${q.id}`}
                    checked={q.correct_answer === optIndex}
                    onChange={() =>
                      updateQuestion(lessonIndex, qIndex, { correct_answer: optIndex })
                    }
                    className="text-purple-600"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...(q.options || [])];
                      newOptions[optIndex] = e.target.value;
                      updateQuestion(lessonIndex, qIndex, { options: newOptions });
                    }}
                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={`Option ${optIndex + 1}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  const newOptions = [...(q.options || []), ""];
                  updateQuestion(lessonIndex, qIndex, { options: newOptions });
                }}
                className="text-xs text-purple-600 hover:text-purple-800"
              >
                + Add option
              </button>
              {(q.options?.length || 0) > 2 && (
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = q.options?.slice(0, -1) || [];
                    updateQuestion(lessonIndex, qIndex, { options: newOptions });
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  - Remove last option
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Select the radio button next to the correct answer
            </p>
          </>
        )}

        {/* True/False */}
        {q.type === "true_false" && (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`tf_${q.id}`}
                checked={q.correct_answer === 0}
                onChange={() => updateQuestion(lessonIndex, qIndex, { correct_answer: 0 })}
                className="text-purple-600"
              />
              <span className="text-sm">True</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`tf_${q.id}`}
                checked={q.correct_answer === 1}
                onChange={() => updateQuestion(lessonIndex, qIndex, { correct_answer: 1 })}
                className="text-purple-600"
              />
              <span className="text-sm">False</span>
            </label>
            <p className="text-xs text-gray-500 ml-auto">Select the correct answer</p>
          </div>
        )}

        {/* Short Answer */}
        {q.type === "short_answer" && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Expected Answer (for auto-grading, leave blank for manual review)
              </label>
              <input
                type="text"
                value={(q.correct_answer as string) || ""}
                onChange={(e) =>
                  updateQuestion(lessonIndex, qIndex, { correct_answer: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Expected answer (optional)"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Hint (optional)
              </label>
              <input
                type="text"
                value={q.hint || ""}
                onChange={(e) =>
                  updateQuestion(lessonIndex, qIndex, { hint: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Provide a hint for the learner"
              />
            </div>
          </>
        )}

        {/* Multi-Select */}
        {q.type === "multi_select" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {q.options?.map((opt, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={((q.correct_answer as number[]) || []).includes(optIndex)}
                    onChange={() => toggleMultiSelectAnswer(lessonIndex, qIndex, optIndex)}
                    className="text-purple-600 rounded"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...(q.options || [])];
                      newOptions[optIndex] = e.target.value;
                      updateQuestion(lessonIndex, qIndex, { options: newOptions });
                    }}
                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={`Option ${optIndex + 1}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  const newOptions = [...(q.options || []), ""];
                  updateQuestion(lessonIndex, qIndex, { options: newOptions });
                }}
                className="text-xs text-purple-600 hover:text-purple-800"
              >
                + Add option
              </button>
              {(q.options?.length || 0) > 2 && (
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = q.options?.slice(0, -1) || [];
                    // Also remove from correct answers if needed
                    const newAnswers = ((q.correct_answer as number[]) || [])
                      .filter(a => a < newOptions.length);
                    updateQuestion(lessonIndex, qIndex, {
                      options: newOptions,
                      correct_answer: newAnswers
                    });
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  - Remove last option
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Check all correct answers (multiple selections allowed)
            </p>
          </>
        )}

        {/* File Upload */}
        {q.type === "file_upload" && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Learners will be prompted to upload a file (e.g., certificate, evidence of completion).
                Files will be stored and available for review.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Accepted File Types
                </label>
                <input
                  type="text"
                  value={(q.accepted_file_types || []).join(", ")}
                  onChange={(e) =>
                    updateQuestion(lessonIndex, qIndex, {
                      accepted_file_types: e.target.value.split(",").map(t => t.trim()),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder=".pdf, .jpg, .png"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Max File Size (MB)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={q.max_file_size_mb || 10}
                  onChange={(e) =>
                    updateQuestion(lessonIndex, qIndex, {
                      max_file_size_mb: parseInt(e.target.value) || 10,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </>
        )}

        {/* Required toggle for all question types */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <input
            type="checkbox"
            id={`required_${q.id}`}
            checked={q.required !== false}
            onChange={(e) =>
              updateQuestion(lessonIndex, qIndex, { required: e.target.checked })
            }
            className="text-purple-600 rounded"
          />
          <label htmlFor={`required_${q.id}`} className="text-xs text-gray-600">
            Required question
          </label>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Module</h1>
          <p className="text-gray-600">Update module details and lessons</p>
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
                              <div className="relative group">
                                <button
                                  type="button"
                                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Question
                                </button>
                                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                  {QUESTION_TYPES.map((qt) => (
                                    <button
                                      key={qt.value}
                                      type="button"
                                      onClick={() => addQuestion(index, qt.value as QuizQuestion["type"])}
                                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                                    >
                                      <qt.icon className="w-4 h-4 text-purple-500" />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{qt.label}</p>
                                        <p className="text-xs text-gray-500">{qt.description}</p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {lesson.questions?.map((q, qIndex) =>
                              renderQuestionEditor(lesson, index, q, qIndex)
                            )}

                            {(!lesson.questions || lesson.questions.length === 0) && (
                              <p className="text-sm text-gray-500 text-center py-4">
                                No questions yet. Click &quot;Add Question&quot; to get started.
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

            {/* Question Types Reference */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Question Types
              </h2>
              <div className="space-y-2">
                {QUESTION_TYPES.map((qt) => (
                  <div key={qt.value} className="flex items-center gap-2 text-sm">
                    <qt.icon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{qt.label}</span>
                  </div>
                ))}
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
                  {saving ? "Saving..." : "Save Changes"}
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

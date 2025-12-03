"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Upload, AlertCircle } from "lucide-react";

export interface QuizQuestion {
  id: string;
  type: "single" | "multiple" | "truefalse" | "short" | "upload";
  prompt: string;
  options?: { id: string; text: string }[];
  correctOptions?: string[];
  expectedAnswer?: string;
  points?: number;
  required?: boolean;
  explanation?: string;
  allow_types?: string[];
}

interface QuizComponentProps {
  questions: QuizQuestion[];
  passScore: number;
  onSubmit: (answers: Record<string, any>, score: number, passed: boolean) => void;
  attemptsUsed: number;
  maxAttempts: number;
  disabled?: boolean;
  previousScore?: number;
}

export default function QuizComponent({
  questions,
  passScore,
  onSubmit,
  attemptsUsed,
  maxAttempts,
  disabled = false,
  previousScore,
}: QuizComponentProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const recordAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleFileUpload = async (questionId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    // For now, just store the file names - actual upload logic would go here
    const fileNames = Array.from(files).map((f) => f.name).join(", ");
    recordAnswer(questionId, fileNames);
  };

  const calculateScore = (): { score: number; passed: boolean } => {
    const normalize = (val: string) => (val || "").trim().toLowerCase();
    const gradedQuestions = questions.filter((q) => q.required !== false);
    const totalPoints = gradedQuestions.reduce((sum, q) => sum + (q.points || 1), 0) || 1;
    let earnedPoints = 0;

    gradedQuestions.forEach((q) => {
      const expected = q.correctOptions || [];
      const selectedRaw = answers[q.id];
      let isCorrect = false;

      if (q.type === "short") {
        isCorrect = normalize(selectedRaw || "") === normalize(q.expectedAnswer || "");
      } else if (q.type === "multiple") {
        const selected = Array.isArray(selectedRaw) ? selectedRaw : [];
        const expectedSet = new Set(expected);
        isCorrect = selected.length === expectedSet.size && selected.every((opt: string) => expectedSet.has(opt));
      } else if (q.type === "upload") {
        isCorrect = !!selectedRaw;
      } else if (q.type === "truefalse") {
        isCorrect = selectedRaw === expected[0];
      } else {
        // single
        const selected = Array.isArray(selectedRaw) ? selectedRaw[0] : selectedRaw;
        isCorrect = selected === expected[0];
      }

      if (isCorrect) {
        earnedPoints += q.points || 1;
      }
    });

    const calculatedScore = Math.round((earnedPoints / totalPoints) * 100);
    return { score: calculatedScore, passed: calculatedScore >= passScore };
  };

  const handleSubmit = () => {
    const { score: calculatedScore, passed } = calculateScore();
    setScore(calculatedScore);
    setShowResults(true);
    onSubmit(answers, calculatedScore, passed);
  };

  const canSubmit = !disabled && attemptsUsed < maxAttempts;
  const passed = previousScore !== undefined && previousScore >= passScore;

  return (
    <div className="bg-purple-50 rounded-lg border border-purple-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-purple-900">Knowledge Check</h3>
          <p className="text-sm text-purple-700">
            Score at least {passScore}% to pass this lesson
          </p>
        </div>
        <div className="text-right text-sm">
          {previousScore !== undefined && (
            <div className={`font-semibold ${passed ? "text-green-600" : "text-red-600"}`}>
              Score: {previousScore}%
            </div>
          )}
          <div className="text-purple-700">
            Attempts: {attemptsUsed} / {maxAttempts}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question, idx) => {
          const selected = answers[question.id];
          const isSingle = question.type === "single" || question.type === "truefalse";
          const selectedArray = Array.isArray(selected) ? selected : selected ? [selected] : [];

          return (
            <div
              key={question.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {idx + 1}. {question.prompt}
                    {question.required !== false && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </p>
                  {showResults && passed && question.explanation && (
                    <p className="text-sm text-gray-500 mt-1">{question.explanation}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 ml-2">
                  {question.points || 1} pt{(question.points || 1) !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Single/Multiple Choice */}
              {(question.type === "single" || question.type === "multiple") && (
                <div className="space-y-2">
                  {question.options?.map((opt) => {
                    const checked = isSingle
                      ? selected === opt.id
                      : selectedArray.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type={isSingle ? "radio" : "checkbox"}
                          name={`q-${question.id}`}
                          checked={checked}
                          disabled={disabled || passed}
                          onChange={() => {
                            if (isSingle) {
                              recordAnswer(question.id, opt.id);
                            } else {
                              const next = checked
                                ? selectedArray.filter((v: string) => v !== opt.id)
                                : [...selectedArray, opt.id];
                              recordAnswer(question.id, next);
                            }
                          }}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span>{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* True/False */}
              {question.type === "truefalse" && (
                <div className="space-y-2">
                  {["true", "false"].map((val) => (
                    <label
                      key={val}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        checked={selected === val}
                        disabled={disabled || passed}
                        onChange={() => recordAnswer(question.id, val)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="capitalize">{val}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Short Answer */}
              {question.type === "short" && (
                <input
                  type="text"
                  value={selected || ""}
                  disabled={disabled || passed}
                  onChange={(e) => recordAnswer(question.id, e.target.value)}
                  placeholder="Type your answer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm disabled:bg-gray-100"
                />
              )}

              {/* File Upload */}
              {question.type === "upload" && (
                <div className="space-y-2">
                  {selected && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      Uploaded: {selected}
                    </p>
                  )}
                  <input
                    type="file"
                    multiple
                    disabled={disabled || passed}
                    accept={question.allow_types?.map((t) => `.${t}`).join(",") || undefined}
                    onChange={(e) => handleFileUpload(question.id, e.target.files)}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="mt-4 flex items-center justify-between">
        {passed ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Quiz Passed!</span>
          </div>
        ) : attemptsUsed >= maxAttempts ? (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Maximum attempts reached. Contact admin to reset.</span>
          </div>
        ) : (
          <div />
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || passed}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {passed ? "Quiz Passed" : "Submit Quiz"}
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import ContentViewer from "./ContentViewer";
import TopViewerBar from "./TopViewerBar";

export function AssignementView({ PROBLEMATIQUES = [], viewerRef, assignmentId }) {
    const [currentLessonIdx, setCurrentLessonIdx] = useState(0);

    // Add safety check at the beginning
    if (!PROBLEMATIQUES || !Array.isArray(PROBLEMATIQUES) || PROBLEMATIQUES.length === 0) {
        return null;
    }

    const lesson = PROBLEMATIQUES[currentLessonIdx];

    // Add safety check for lesson
    if (!lesson) {
        return null;
    }

    const goTo = (idx) => {
        if (idx >= 0 && idx < PROBLEMATIQUES.length) {
            setCurrentLessonIdx(idx);
            viewerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <>
            <TopViewerBar
                currentIndex={currentLessonIdx}
                lessonsCount={PROBLEMATIQUES.length}
                title={lesson.title || "Untitled"}
                contentType={"assignment"}
                goTo={goTo}
                contentId={assignmentId}
            />
            <ContentViewer
                content={lesson.content || ""}
                title={lesson.title || "Untitled"}
                exerciseType={lesson.exerciseType || "text"}
                fileUrl={lesson.fileUrl || ""}
                questions={lesson.questions || []}
            />
            <div className="cd-viewer-nav">
                {currentLessonIdx > 0 && (
                    <button className="cd-viewer-nav-btn" onClick={() => goTo(currentLessonIdx - 1)}>
                        ← {PROBLEMATIQUES[currentLessonIdx - 1]?.title || "Previous"}
                    </button>
                )}
                {currentLessonIdx < PROBLEMATIQUES.length - 1 && (
                    <button className="cd-viewer-nav-btn cd-viewer-nav-btn--next" onClick={() => goTo(currentLessonIdx + 1)}>
                        {PROBLEMATIQUES[currentLessonIdx + 1]?.title || "Next"} →
                    </button>
                )}
            </div>
        </>
    );
}
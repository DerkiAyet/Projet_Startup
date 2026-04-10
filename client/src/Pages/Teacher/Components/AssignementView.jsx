import { useState } from "react";
import ContentViewer from "./ContentViewer";
import TopViewerBar from "./TopViewerBar";

export function AssignementView({ PROBLEMATIQUES, viewerRef }) {
    const [currentLessonIdx, setCurrentLessonIdx] = useState(0);

    const lesson = PROBLEMATIQUES[currentLessonIdx];


    const goTo = (idx) => {
        setCurrentLessonIdx(idx);
        viewerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (!PROBLEMATIQUES || PROBLEMATIQUES.length === 0) return null;

    return (
        <>
                <TopViewerBar
                    currentIndex={currentLessonIdx}
                    lessonsCount={PROBLEMATIQUES.length}
                    title={lesson.title}
                    contentType={"assignement"}
                    goTo={goTo}
                />

            <ContentViewer
                content={lesson.content}
            />

            <div className="cd-viewer-nav">
                {currentLessonIdx > 0 && (
                    <button className="cd-viewer-nav-btn" onClick={() => goTo(currentLessonIdx - 1)}>
                        ← {PROBLEMATIQUES[currentLessonIdx - 1].title}
                    </button>
                )}
                {currentLessonIdx < PROBLEMATIQUES.length - 1 && (
                    <button className="cd-viewer-nav-btn cd-viewer-nav-btn--next" onClick={() => goTo(currentLessonIdx + 1)}>
                        {PROBLEMATIQUES[currentLessonIdx + 1].title} →
                    </button>
                )}
            </div>
        </>
    );
}
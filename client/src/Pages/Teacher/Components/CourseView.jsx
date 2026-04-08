import { useState } from "react";
import ContentViewer from "./ContentViewer";
import TopViewerBar from "./TopViewerBar";

export function CourseView({ LESSONS, viewerRef, handleChangePct }) {

    const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
    const [doneLessons, setDoneLessons] = useState(new Set());

    const lesson = LESSONS[currentLessonIdx];
    const isDone = doneLessons.has(lesson.id);

    const goTo = (idx) => {
        setCurrentLessonIdx(idx);
        viewerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggleDone = () => {
        setDoneLessons((prev) => {
            const next = new Set(prev);
            next.has(lesson.id) ? next.delete(lesson.id) : next.add(lesson.id);
             handleChangePct(next.size);
            return next;
        });
    };

    return (
        <>
            <TopViewerBar
                currentIndex={currentLessonIdx}
                lessonsCount={LESSONS.length}
                title={lesson.title}
                contentType={"course"}
                goTo={goTo}
                isDone={isDone}
                toggleDone={toggleDone}
            />

            <ContentViewer
                content={lesson.content}
                title={lesson.title}
            />

            <div className="cd-viewer-nav">
                {currentLessonIdx > 0 && (
                    <button className="cd-viewer-nav-btn" onClick={() => goTo(currentLessonIdx - 1)}>
                        ← {LESSONS[currentLessonIdx - 1].title}
                    </button>
                )}
                {currentLessonIdx < LESSONS.length - 1 && (
                    <button className="cd-viewer-nav-btn cd-viewer-nav-btn--next" onClick={() => goTo(currentLessonIdx + 1)}>
                        {LESSONS[currentLessonIdx + 1].title} →
                    </button>
                )}
            </div>
        </>
    );
}
import { useState, useEffect, useContext } from "react";
import ContentViewer from "./ContentViewer";
import TopViewerBar from "./TopViewerBar";
import axios from 'axios'
import { AppContext } from "../../../App";

export function CourseView({ LESSONS, viewerRef, handleChangePct, courseId, onChangeDone, initializeDone, onChangeLesson }) {

    const { userAuth } = useContext(AppContext)
    const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
    const [enrollement, setEnrollement] = useState({})
    const [doneLessons, setDoneLessons] = useState(new Set());

    useEffect(() => {
        if (userAuth.role === "student") {
            axios.get(`http://localhost:8080/content/activity/enrollements/${courseId}`)
                .then((res) => {
                    setEnrollement(res.data)
                    setDoneLessons(new Set(res.data.lessonsCompleted))
                    initializeDone(new Set(res.data.lessonsCompleted))
                })
        }
    }, [ courseId, initializeDone])

    const lesson = LESSONS[currentLessonIdx];
    const isDone = doneLessons.has(lesson._id);

    const goTo = (idx) => {
        setCurrentLessonIdx(idx);
        onChangeLesson?.(idx);
        viewerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggleDone = () => {
        axios.put(`http://localhost:8080/content/activity/enrollements/${enrollement._id}/lesson-completed/${lesson._id}`, {}, {
            headers: { "Content-Type": "application/json" }
        })
            .then((res) => {
                // Build the Set from the server's source of truth
                const updatedSet = new Set(res.data.lessonsCompleted);
                setDoneLessons(updatedSet);
                handleChangePct(updatedSet.size);
                onChangeDone?.(updatedSet); 
            })
            .catch((err) => console.error(err.response.data))
    };

    if (!LESSONS || LESSONS.length === 0) return null;

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
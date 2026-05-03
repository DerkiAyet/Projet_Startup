import { useState, useEffect, useRef } from "react";

export default function ContentViewer({ content, title, lessonType, videoUrl, exerciseType, fileUrl, questions }) {

    const [pages, setPages] = useState([]);
    const viewerRef = useRef(null);
    const viewerWidth = 650;
    const pageHeight = 600;

    const paginateContent = (htmlString) => {
        const temp = document.createElement("div");
        temp.style.width = viewerWidth + "px";
        temp.style.position = "absolute";
        temp.style.visibility = "hidden";
        temp.innerHTML = htmlString;
        document.body.appendChild(temp);
        const childNodes = Array.from(temp.childNodes);
        let currentPage = document.createElement("div");
        let currentHeight = 0;
        const newPages = [];
        childNodes.forEach((node) => {
            const clone = node.cloneNode(true);
            temp.appendChild(clone);
            const height = clone.offsetHeight;
            if (currentHeight + height > pageHeight) {
                newPages.push(currentPage.innerHTML);
                currentPage = document.createElement("div");
                currentHeight = 0;
            }
            currentPage.appendChild(clone);
            currentHeight += height;
        });
        if (currentPage.innerHTML.trim()) {
            newPages.push(currentPage.innerHTML);
        }
        document.body.removeChild(temp);
        setPages(newPages);
    };

    useEffect(() => {
        if (lessonType !== "video" && exerciseType === "text" || (!lessonType && !exerciseType)) {
            paginateContent(content);
        }
    }, [content, lessonType, exerciseType]);

    // ── Video lesson ──
    if (lessonType === "video" && videoUrl) {
        return (
            <div className="cd-viewer">
                <div className="cd-page-card">
                    <div className="cd-page-number">Video Lesson</div>
                    <div className="cd-page-content" style={{ padding: "1rem 0" }}>
                        <video
                            src={videoUrl}
                            controls
                            controlsList="nodownload"
                            style={{ width: "100%", borderRadius: "10px", maxHeight: "480px", background: "#000" }}
                        />
                    </div>
                    <div className="cd-page-footer">
                        <span>{title}</span>
                        <span>Video</span>
                    </div>
                </div>
            </div>
        );
    }

    // ── File exercise ──
    if (exerciseType === "file") {
        const isPDF = fileUrl?.toLowerCase().endsWith(".pdf");
        return (
            <div className="cd-viewer">
                <div className="cd-page-card">
                    <div className="cd-page-number">File Exercise</div>
                    <div className="cd-page-content" style={{ padding: "1rem 0" }}>
                        {fileUrl ? (
                            isPDF ? (
                                <iframe
                                    src={`${process.env.REACT_APP_API_URL_GATEWAY}/content/uploads/${fileUrl}`}
                                    title={title}
                                    style={{ width: "100%", height: "500px", border: "none", borderRadius: "10px" }}
                                />
                            ) : (
                                <img
                                    src={`${process.env.REACT_APP_API_URL_GATEWAY}/content/uploads/${fileUrl}`}
                                    alt={title}
                                    style={{ width: "100%", borderRadius: "10px", objectFit: "contain" }}
                                />
                            )
                        ) : (
                            <p style={{ fontFamily: "'Nunito', sans-serif", color: "#8E8E8E", textAlign: "center" }}>
                                No file attached to this exercise.
                            </p>
                        )}
                    </div>
                    <div className="cd-page-footer">
                        <span>{title}</span>
                        {fileUrl && (
                            <a
                                href={`${process.env.REACT_APP_API_URL_GATEWAY}/content/uploads/${fileUrl}`}
                                download
                                style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "#EC4899", textDecoration: "none", fontWeight: 600 }}
                                target="_blank"
                            >
                                Download ↓
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── MCQ exercise ──
    if (exerciseType === "mcq") {
        return (
            <div className="cd-viewer">
                {(questions || []).map((q, qIdx) => (
                    <div className="cd-page-card" key={qIdx}>
                        <div className="cd-page-number">Question {qIdx + 1}</div>
                        <div className="cd-page-content">
                            <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#1E293B", marginBottom: "1rem" }}>
                                {q.questionContent}
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                {(q.options || []).map((opt, oIdx) => (
                                    <div
                                        key={oIdx}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "0.7rem",
                                            padding: "0.7rem 1rem", borderRadius: "10px",
                                            border: "1.5px solid #A7A7A7",
                                            fontFamily: "'Nunito', sans-serif",
                                            fontSize: "0.92rem", color: "#1E293B",
                                            background: "#fff"
                                        }}
                                    >
                                        <div style={{
                                            width: "18px", height: "18px", borderRadius: q.allowMultiple ? "4px" : "50%",
                                            border: "2px solid #A7A7A7", flexShrink: 0,
                                            background: "transparent"
                                        }} />
                                        {opt.text}
                                    </div>
                                ))}
                            </div>
                            {q.points && (
                                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "#8E8E8E", marginTop: "0.8rem" }}>
                                    {q.points} {q.points === 1 ? "point" : "points"}
                                    {q.allowMultiple && " · Multiple answers allowed"}
                                </p>
                            )}
                        </div>
                        <div className="cd-page-footer">
                            <span>{title}</span>
                            <span>{qIdx + 1} / {questions.length}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // ── Default: text (paginated) ──
    return (
        <div className="cd-viewer" ref={viewerRef}>
            {pages.map((html, i) => (
                <div className="cd-page-card" key={i}>
                    <div className="cd-page-number">Page {i + 1}</div>
                    <div className="cd-page-content" dangerouslySetInnerHTML={{ __html: html }} />
                    <div className="cd-page-footer">
                        <span>{title}</span>
                        <span>{i + 1} / {pages.length}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
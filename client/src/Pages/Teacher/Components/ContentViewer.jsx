import { useState, useEffect, useRef } from "react";

export default function ContentViewer({ content, title }) {
    const [pages, setPages] = useState([]);
    const viewerRef = useRef(null);

    const viewerWidth = 650;
    const pageHeight = 400;

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
        paginateContent(content);
    }, [content]);

    return (
        <div className="cd-viewer" ref={viewerRef}>
            {pages.map((html, i) => (
                <div className="cd-page-card" key={i}>
                    <div className="cd-page-number">Page {i + 1}</div>
                    <div
                        className="cd-page-content"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                    <div className="cd-page-footer">
                        <span>{title}</span>
                        <span>{i + 1} / {pages.length}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
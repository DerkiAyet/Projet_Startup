import { useState } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator
} from "react-native";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import { Lesson, Exercise } from "@/app/types/Content";

type Item = Lesson | Exercise;

const HTML_WRAPPER = (body: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, sans-serif;
      font-size: 16px;
      color: #1E293B;
      padding: 16px;
      line-height: 1.7;
      background-color: #fff;
    }
    h1, h2, h3, h4 { margin: 16px 0 8px; font-weight: 600; }
    p { margin-bottom: 12px; }
    ul, ol { padding-left: 20px; margin-bottom: 12px; }
    li { margin-bottom: 6px; }
    img { max-width: 100%; border-radius: 8px; }
    pre, code {
      background: #F5F5F5;
      border-radius: 6px;
      padding: 4px 8px;
      font-family: monospace;
      font-size: 14px;
      overflow-x: auto;
    }
    pre { padding: 12px; margin-bottom: 12px; }
    blockquote {
      border-left: 3px solid #F29DB6;
      padding-left: 12px;
      color: #8A8A8A;
      margin-bottom: 12px;
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    td, th { border: 1px solid #D9E1E7; padding: 8px; font-size: 14px; }
    th { background: #F5F5F5; font-weight: 600; }
    a { color: #F29DB6; }
  </style>
</head>
<body>${body}</body>
</html>
`;

export function LessonViewer({ items }: {
    items: Item[];
}) {
    const [index, setIndex] = useState(0);
    const [webViewHeight, setWebViewHeight] = useState(500);
    const [loading, setLoading] = useState(true);

    if (!items.length) return (
        <View style={s.empty}>
            <Text style={s.emptyText}>No content available</Text>
        </View>
    );

    const item = items[index];
    const isLesson = "lessonType" in item;
    const isExercise = "exerciseType" in item;

    const lessonType = isLesson ? (item as Lesson).lessonType : null;
    const exerciseType = isExercise ? (item as Exercise).exerciseType : null;

    const contentType = lessonType ?? exerciseType;

    return (
        <View style={s.container}>
            {/* ── Top bar ── */}
            <View style={s.topBar}>
                <View style={s.titleWrap}>
                    <Text style={s.itemTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={s.counter}>{index + 1} / {items.length}</Text>
                </View>

                <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    <TouchableOpacity
                        style={[s.navBtn, index === 0 && s.navBtnDisabled]}
                        onPress={() => { setIndex(i => i - 1); setLoading(true); }}
                        disabled={index === 0}
                    >
                        <Feather name="chevron-left" size={18} color={index === 0 ? "#D9E1E7" : "#1E293B"} />
                        <Text style={[s.navText, index === 0 && s.navTextDisabled]}>Prev</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[s.navBtn, index === items.length - 1 && s.navBtnDisabled]}
                        onPress={() => { setIndex(i => i + 1); setLoading(true); }}
                        disabled={index === items.length - 1}
                    >
                        <Text style={[s.navText, index === items.length - 1 && s.navTextDisabled]}>Next</Text>
                        <Feather name="chevron-right" size={18} color={index === items.length - 1 ? "#D9E1E7" : "#1E293B"} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Content type badge ── */}
            <View style={s.badgeRow}>
                <View style={s.badge}>
                    <Feather
                        name={
                            contentType === "video" ? "video" :
                                contentType === "file" ? "file-text" :
                                    contentType === "mcq" ? "check-square" :
                                        "align-left"
                        }
                        size={12}
                        color="#F29DB6"
                    />
                    <Text style={s.badgeText}>{contentType?.toUpperCase()}</Text>
                </View>
            </View>

            {/* ── Text / HTML content ── */}
            {(contentType === "text" || !contentType) && (
                <View style={{ height: webViewHeight }}>
                    {loading && (
                        <ActivityIndicator
                            style={StyleSheet.absoluteFill}
                            color="#F29DB6"
                        />
                    )}
                    <WebView
                        originWhitelist={["*"]}
                        source={{
                            html: HTML_WRAPPER(
                                (item as Lesson).content ??
                                (item as Exercise).content ??
                                "<p>No content.</p>"
                            )
                        }}
                        scrollEnabled={true}
                        onLoad={() => setLoading(false)}
                        // auto-height trick
                        injectedJavaScript={`
                            window.ReactNativeWebView.postMessage(
                                JSON.stringify({ height: document.body.scrollHeight })
                            ); true;
                        `}
                        onMessage={(e) => {
                            const { height } = JSON.parse(e.nativeEvent.data);
                            setWebViewHeight(height + 32);
                        }}
                        style={{ backgroundColor: "transparent" }}
                    />
                </View>
            )}

            {/* ── Video content ── */}
            {contentType === "video" && (
                <WebView
                    source={{ uri: (item as Lesson).videoUrl ?? "" }}
                    style={s.videoPlayer}
                    allowsFullscreenVideo
                    mediaPlaybackRequiresUserAction={false}
                />
            )}

            {/* ── PDF / file content ── */}
            {contentType === "file" && (
                <WebView
                    source={{
                        uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
                            `${process.env.EXPO_PUBLIC_API_URL}/content/uploads/${(item as Exercise).fileUrl}`
                        )
                            }`
                    }}
                    style={s.pdfViewer}
                    onLoad={() => setLoading(false)}
                />
            )}

            {/* ── MCQ content ── */}
            {contentType === "mcq" && (
                <MCQViewer questions={(item as Exercise).questions ?? []} />
            )}
        </View>
    );
}

// ─── MCQ sub-component ────────────────────────────────────────────────────────

function MCQViewer({ questions }: { questions: any[] }) {
    const [answers, setAnswers] = useState<Record<number, string[]>>({});
    const [submitted, setSubmitted] = useState(false);

    const toggle = (qIndex: number, option: string, allowMultiple: boolean) => {
        if (submitted) return;
        setAnswers(prev => {
            const current = prev[qIndex] ?? [];
            if (allowMultiple) {
                return {
                    ...prev,
                    [qIndex]: current.includes(option)
                        ? current.filter(o => o !== option)
                        : [...current, option]
                };
            }
            return { ...prev, [qIndex]: [option] };
        });
    };

    return (
        <View style={s.mcqWrap}>
            {questions.map((q, qi) => (
                <View key={qi} style={s.mcqQuestion}>
                    <Text style={s.mcqQuestionText}>{qi + 1}. {q.questionContent}</Text>
                    {q.options.map((opt: any, oi: number) => {
                        const optText = typeof opt === "string" ? opt : opt.text;
                        const isCorrect = typeof opt === "object" ? opt.isCorrect : false;
                        const selected = (answers[qi] ?? []).includes(optText);
                        const showCorrect = submitted && isCorrect;
                        const showWrong = submitted && selected && !isCorrect;

                        return (
                            <TouchableOpacity
                                key={oi}
                                style={[
                                    s.mcqOption,
                                    selected && s.mcqOptionSelected,
                                    showCorrect && s.mcqOptionCorrect,
                                    showWrong && s.mcqOptionWrong,
                                ]}
                                onPress={() => toggle(qi, optText, q.allowMultiple)}
                            >
                                <Text style={[
                                    s.mcqOptionText,
                                    selected && s.mcqOptionTextSelected,
                                ]}>
                                    {optText}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                    {submitted && q.explanation && (
                        <Text style={s.mcqExplanation}>💡 {q.explanation}</Text>
                    )}
                </View>
            ))}

            {!submitted && (
                <TouchableOpacity style={s.submitBtn} onPress={() => setSubmitted(true)}>
                    <Text style={s.submitBtnText}>Submit Answers</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    container: { flex: 1 },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#D9E1E7",
        backgroundColor: "#fff",
    },
    navBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "#F5F5F5",
    },
    navBtnDisabled: { backgroundColor: "#FAFAFA" },
    navText: { fontSize: 13, fontWeight: "600", color: "#1E293B" },
    navTextDisabled: { color: "#D9E1E7" },
    titleWrap: { flex: 1, paddingHorizontal: 8 },
    itemTitle: { fontSize: 13, fontWeight: "600", color: "#EC4899", textTransform: "capitalize" },
    counter: { fontSize: 11, color: "#8A8A8A", marginTop: 2 },
    badgeRow: { flexDirection: "row", padding: 12, backgroundColor: "#fff" },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#fce4ec",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },
    badgeText: { fontSize: 10, color: "#F29DB6", fontWeight: "700" },
    videoPlayer: { width: "100%", height: 220 },
    pdfViewer: { width: "100%", height: 500 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
    emptyText: { color: "#8A8A8A", fontSize: 14 },

    // MCQ
    mcqWrap: { padding: 16, gap: 20 },
    mcqQuestion: { gap: 8 },
    mcqQuestionText: { fontSize: 14, fontWeight: "600", color: "#1E293B", lineHeight: 20 },
    mcqOption: {
        borderWidth: 1.5,
        borderColor: "#D9E1E7",
        borderRadius: 10,
        padding: 10,
    },
    mcqOptionSelected: { borderColor: "#F29DB6", backgroundColor: "#fce4ec" },
    mcqOptionCorrect: { borderColor: "#22c55e", backgroundColor: "#dcfce7" },
    mcqOptionWrong: { borderColor: "#ef4444", backgroundColor: "#fee2e2" },
    mcqOptionText: { fontSize: 13, color: "#1E293B" },
    mcqOptionTextSelected: { color: "#831843", fontWeight: "500" },
    mcqExplanation: { fontSize: 12, color: "#8A8A8A", fontStyle: "italic", marginTop: 4 },
    submitBtn: {
        backgroundColor: "#F29DB6",
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 8,
    },
    submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
import React, { useState, useEffect, useCallback } from 'react'
import { evaluate, sqrt, log, log10, sin, cos, tan, pi, e } from 'mathjs'
import '../Styles/Calculator.css'

const MAX_HISTORY = 20

// ── Button definitions ────────────────────────────────────────────────────────
const BUTTONS = [
    // Row 1 — mode / memory
    { label: 'RAD',  type: 'mode',     value: 'RAD'  },
    { label: 'DEG',  type: 'mode',     value: 'DEG'  },
    { label: 'AC',   type: 'clear',    value: 'AC'   },
    { label: '⌫',    type: 'del',      value: 'DEL'  },

    // Row 2 — functions top
    { label: 'sin',  type: 'fn',       value: 'sin(' },
    { label: 'cos',  type: 'fn',       value: 'cos(' },
    { label: 'tan',  type: 'fn',       value: 'tan(' },
    { label: 'xʸ',   type: 'op',       value: '^'    },

    // Row 3 — functions mid
    { label: '√',    type: 'fn',       value: 'sqrt('},
    { label: 'log',  type: 'fn',       value: 'log10('},
    { label: 'ln',   type: 'fn',       value: 'log(' },
    { label: '%',    type: 'op',       value: '%'    },

    // Row 4 — constants + parens
    { label: 'π',    type: 'const',    value: 'pi'   },
    { label: 'e',    type: 'const',    value: 'e'    },
    { label: '(',    type: 'paren',    value: '('    },
    { label: ')',    type: 'paren',    value: ')'    },

    // Row 5 — digits + ops
    { label: '7',    type: 'digit',    value: '7'    },
    { label: '8',    type: 'digit',    value: '8'    },
    { label: '9',    type: 'digit',    value: '9'    },
    { label: '÷',    type: 'op',       value: '/'    },

    // Row 6
    { label: '4',    type: 'digit',    value: '4'    },
    { label: '5',    type: 'digit',    value: '5'    },
    { label: '6',    type: 'digit',    value: '6'    },
    { label: '×',    type: 'op',       value: '*'    },

    // Row 7
    { label: '1',    type: 'digit',    value: '1'    },
    { label: '2',    type: 'digit',    value: '2'    },
    { label: '3',    type: 'digit',    value: '3'    },
    { label: '−',    type: 'op',       value: '-'    },

    // Row 8
    { label: '±',    type: 'negate',   value: 'NEG'  },
    { label: '0',    type: 'digit',    value: '0'    },
    { label: '.',    type: 'digit',    value: '.'    },
    { label: '+',    type: 'op',       value: '+'    },

    // Row 9 — equals (full width)
    { label: '=',    type: 'equals',   value: '='    },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const toRadians = (expr) =>
    expr
        .replace(/sin\(/g,  'sin(pi/180*')
        .replace(/cos\(/g,  'cos(pi/180*')
        .replace(/tan\(/g,  'tan(pi/180*')

const formatResult = (val) => {
    if (typeof val === 'number') {
        if (!isFinite(val)) return 'Error'
        // trim floating noise
        const fixed = parseFloat(val.toPrecision(12))
        return String(fixed)
    }
    return String(val)
}

// ── Main component ────────────────────────────────────────────────────────────
function Calculator({ onClose }) {
    const [expr,    setExpr]    = useState('')
    const [display, setDisplay] = useState('0')
    const [result,  setResult]  = useState('')
    const [mode,    setMode]    = useState('DEG')   // DEG | RAD
    const [history, setHistory] = useState([])
    const [showHist,setShowHist]= useState(false)
    const [pressed, setPressed] = useState(null)

    // live preview as user types
    useEffect(() => {
        if (!expr) { setResult(''); return }
        try {
            const raw  = mode === 'DEG' ? toRadians(expr) : expr
            const val  = evaluate(raw, { pi, e })
            setResult(formatResult(val))
        } catch {
            setResult('')
        }
    }, [expr, mode])

    const flashBtn = (val) => {
        setPressed(val)
        setTimeout(() => setPressed(null), 120)
    }

    const handleBtn = useCallback((type, value) => {
        flashBtn(value)

        if (type === 'mode')   { setMode(value); return }

        if (type === 'clear') {
            setExpr(''); setDisplay('0'); setResult(''); return
        }
        if (type === 'del') {
            setExpr(p => p.slice(0, -1)); return
        }
        if (type === 'negate') {
            setExpr(p => p ? `-(${p})` : ''); return
        }

        if (type === 'equals') {
            if (!expr) return
            try {
                const raw = mode === 'DEG' ? toRadians(expr) : expr
                const val = evaluate(raw, { pi, e })
                const res = formatResult(val)
                setHistory(h => [{ expr, result: res }, ...h].slice(0, MAX_HISTORY))
                setExpr(res)
                setDisplay(res)
                setResult('')
            } catch {
                setDisplay('Error')
                setExpr('')
                setResult('')
            }
            return
        }

        // all other inputs — append to expression
        setExpr(p => p + value)
        setDisplay(expr + value)
    }, [expr, mode])

    // keyboard support
    useEffect(() => {
        const map = {
            'Enter': () => handleBtn('equals', '='),
            'Backspace': () => handleBtn('del', 'DEL'),
            'Escape': () => handleBtn('clear', 'AC'),
        }
        const handler = (e) => {
            if (map[e.key]) { map[e.key](); return }
            if (/[\d+\-*/.^%()]/.test(e.key)) handleBtn('digit', e.key)
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [handleBtn])

    const displayValue = expr || '0'

    return (
            <div className="calc-shell" onClick={(e) => {e.stopPropagation(); onClose()}}>

                {/* ── Header ── */}
                <div className="calc-header">
                    <div className="calc-header-left">
                        <div className="calc-header-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <rect x="4" y="2" width="16" height="20" rx="3" stroke="white" strokeWidth="2"/>
                                <path d="M8 7h8M8 12h4M8 17h2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="calc-title">Calculator</h2>
                            <p className="calc-sub">Scientific mode</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            className="calc-hist-toggle"
                            onClick={() => setShowHist(p => !p)}
                            title="History"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2"/>
                                <path d="M12 7v5l3 3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            History
                        </button>
                        <button className="calc-close-btn" onClick={onClose}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="calc-body">

                    {/* ── History panel ── */}
                    {showHist && (
                        <div className="calc-history-panel">
                            <div className="calc-history-header">
                                <span>Recent</span>
                                {history.length > 0 && (
                                    <button onClick={() => setHistory([])}>Clear</button>
                                )}
                            </div>
                            {history.length === 0 ? (
                                <p className="calc-history-empty">No calculations yet</p>
                            ) : (
                                <ul className="calc-history-list">
                                    {history.map((h, i) => (
                                        <li key={i} onClick={() => { setExpr(h.result); setShowHist(false) }}>
                                            <span className="hist-expr">{h.expr}</span>
                                            <span className="hist-result">= {h.result}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* ── Display ── */}
                    <div className="calc-display">
                        <div className="calc-display-mode">{mode}</div>
                        <div className="calc-display-expr" title={displayValue}>
                            {displayValue}
                        </div>
                        {result && (
                            <div className="calc-display-preview">= {result}</div>
                        )}
                    </div>

                    {/* ── Buttons grid ── */}
                    <div className="calc-grid">
                        {BUTTONS.map((btn, i) => (
                            <button
                                key={i}
                                className={[
                                    'calc-btn',
                                    `calc-btn--${btn.type}`,
                                    btn.type === 'mode' && mode === btn.value ? 'calc-btn--mode-active' : '',
                                    pressed === btn.value ? 'calc-btn--pressed' : '',
                                    btn.type === 'equals' ? 'calc-btn--wide' : '',
                                ].filter(Boolean).join(' ')}
                                onClick={() => handleBtn(btn.type, btn.value)}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
    )
}

export default Calculator
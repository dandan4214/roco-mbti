import { questions } from '../data';

interface Props {
  answers: Record<string, number>;
  onAnswer: (qid: string, idx: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const codes = ['A', 'B', 'C', 'D', 'E'];

export default function QuizScreen({ answers, onAnswer, onSubmit, onBack }: Props) {
  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
  const progress = questions.length ? (answeredCount / questions.length) * 100 : 0;
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="test-wrap card fade-in">
      <div className="topbar">
        <div className="progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">{answeredCount} / {questions.length}</div>
      </div>
      <div className="question-list">
        {questions.map((q, i) => (
          <article key={q.id} className="question">
            <div className="question-meta">
              <div className="badge">第 {i + 1}题</div>
              <div>{answers[q.id] !== undefined ? '✓ 已作答' : '○ 待作答'}</div>
            </div>
            <div className="question-title">{q.text}</div>
            <div className="options">
              {q.options.map((opt, j) => (
                <div
                  key={j}
                  className={`option ${answers[q.id] === j ? 'selected' : ''}`}
                  onClick={() => onAnswer(q.id, j)}
                >
                  <div className="option-code">{codes[j] || String(j + 1)}</div>
                  <div>{opt.label}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="actions-bottom">
        <div className="hint">
          {allAnswered ? '都做完了。现在可以把你的精灵魂魄交给结果页审判。' : '全选完才会放行。'}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={onBack}>返回首页</button>
          <button className="btn-primary" onClick={onSubmit} disabled={!allAnswered}>
            提交并查看结果
          </button>
        </div>
      </div>
    </div>
  );
}

import { IconClose } from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  name: string;
  sub: string;
  img: string;
  quote: string;
  onShareWechat: () => void;
  onCopyText: () => void;
}

export default function ShareCard({ open, onClose, name, sub, img, quote, onShareWechat, onCopyText }: Props) {
  if (!open) return null;

  return (
    <div className="share-card" onClick={onClose}>
      <div className="share-card-inner" onClick={(e) => e.stopPropagation()}>
        <div className="share-card-close" onClick={onClose}><IconClose size={18} /></div>
        <div className="share-card-preview">
          <div className="sc-name">{name}</div>
          <div className="sc-type">{sub}</div>
          <img className="sc-img" src={img || ''} alt="" />
          <div className="sc-quote">{quote}</div>
        </div>
        <div className="share-card-tip">长按上方图片保存，或截图分享到朋友圈</div>
        <div className="share-btns" style={{ marginTop: 0 }}>
          <button className="share-btn wx" onClick={onShareWechat}>微信分享</button>
          <button className="share-btn" onClick={onCopyText}>复制文案</button>
        </div>
      </div>
    </div>
  );
}

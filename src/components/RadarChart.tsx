import { getRadarSVG } from '../utils';

interface Props {
  scores: Record<string, number>;
}

export default function RadarChart({ scores }: Props) {
  return (
    <div
      className="radar-wrap"
      dangerouslySetInnerHTML={{ __html: getRadarSVG(scores) }}
    />
  );
}

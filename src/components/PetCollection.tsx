import { results, petKeys, shinyPets } from '../data';
import { isPetUnlocked, isShinyUnlocked } from '../storage';
import { IconTrophy, IconQuestion } from './Icon';

interface Props {
  onBack: () => void;
  onViewPet: (petKey: string) => void;
}

function petSerial(index: number): string {
  return String(index + 1).padStart(3, '0');
}

export default function PetCollection({ onBack, onViewPet }: Props) {
  const unlocked = petKeys.map((key) => {
    const pet = results[key];
    const unlocked = isPetUnlocked(pet.name);
    const shinyUnlocked = unlocked && isShinyUnlocked(pet.name);
    return {
      key,
      pet,
      unlocked,
      shinyUnlocked,
      art: shinyUnlocked
        ? (shinyPets[key]?.shinyImg || pet.shinyImg || pet.img)
        : (pet.normalImg || pet.img),
    };
  });
  const unlockedCount = unlocked.filter((u) => u.unlocked).length;

  return (
    <div className="test-wrap card fade-in">
      <div className="topbar">
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <IconTrophy size={18} />
          精灵图鉴 · {unlockedCount} / {petKeys.length}
        </div>
        <button
          className="btn-secondary"
          style={{ padding: '8px 16px', fontSize: 13 }}
          onClick={onBack}
        >
          返回
        </button>
      </div>

      <div className="tcg-grid">
        {unlocked.map(({ key, pet, unlocked, shinyUnlocked, art }, idx) => (
          <div
            key={key}
            className={`tcg-card ${unlocked ? (shinyUnlocked ? 'tcg-shiny' : 'tcg-normal') : 'tcg-locked'}`}
            onClick={() => unlocked && onViewPet(key)}
            role={unlocked ? 'button' : undefined}
          >
            <div className="tcg-card-frame">
              <div className="tcg-card-inner">
                <div className="tcg-card-serial">№ {petSerial(idx)}</div>
                <div className="tcg-card-type">{unlocked ? pet.type.slice(0, 2) : '??'}</div>

                <div className="tcg-card-art">
                  {unlocked ? (
                    <img src={art} alt={pet.name} loading="lazy" />
                  ) : (
                    <div className="tcg-card-locked-icon">
                      <IconQuestion size={48} />
                    </div>
                  )}
                </div>

                <div className="tcg-card-ribbon">
                  {unlocked ? pet.name : '???'}
                </div>
                <div className="tcg-card-meta">
                  {unlocked ? pet.type : '未解锁'}
                </div>

                <div className="tcg-corner tl" />
                <div className="tcg-corner tr" />
                <div className="tcg-corner bl" />
                <div className="tcg-corner br" />
              </div>
            </div>
          </div>
        ))}

        {/* Permanently mysterious slot — hints at the fallback pet without revealing it */}
        <div className="tcg-card tcg-mystery" aria-label="未知存档" title="存档未知 · 系统拒绝读取">
          <div className="tcg-card-frame">
            <div className="tcg-card-inner">
              <div className="tcg-card-serial">№ 000</div>
              <div className="tcg-card-type">??</div>

              <div className="tcg-card-art">
                <div className="tcg-card-locked-icon">
                  <IconQuestion size={48} />
                </div>
              </div>

              <div className="tcg-card-ribbon">???</div>
              <div className="tcg-card-meta">存档损坏</div>

              <div className="tcg-corner tl" />
              <div className="tcg-corner tr" />
              <div className="tcg-corner bl" />
              <div className="tcg-corner br" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

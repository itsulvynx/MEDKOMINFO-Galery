import { Mail, MapPin, Instagram } from 'lucide-react';
import { ClosingData, TeamMember } from '../types/gallery';
import { ClosingEpilogue } from '../components/ClosingEpilogue';

interface TentangPageProps {
  members: TeamMember[];
  curatorPhotoUrl: string;
  closing: ClosingData | null;
  loading: boolean;
  onVideoPlay?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'HM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

function FramedMemberCard({
  member,
  index,
}: {
  member: TeamMember;
  index: number;
}) {
  const isChiefRole =
    member.isLeader ||
    member.role.toLowerCase().includes('ketua') ||
    member.role.toLowerCase().includes('kepala');

  return (
    <article className="flex flex-col gap-2.5 sm:gap-3.5">
      {/* 1 Pigura = 1 Orang (compact di HP, lega di desktop) */}
      <div className="group passepartout-frame !p-2.5 sm:!p-4">
        <div className="cyanotype-photo-wrap aspect-[3/4] w-full">
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={`${member.name} — ${member.role}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="cyanotype-photo-img w-full h-full object-cover group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full bg-[#0B2A4A] p-2 sm:p-3 flex flex-col justify-between relative">
              <div className="w-full h-full border border-[#F2EEE3]/20 flex flex-col items-center justify-center p-2 sm:p-4 text-center gap-2 sm:gap-3">
                <div className="w-11 h-11 sm:w-16 sm:h-16 border border-[#F2B35E]/50 flex items-center justify-center bg-[#07182B]/70">
                  <span className="font-serif-editorial text-lg sm:text-2xl text-[#F2B35E]">
                    {getInitials(member.name)}
                  </span>
                </div>
                <span className="font-mono-catalog text-[8px] sm:text-[9px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-[#F2EEE3]/55">
                  HIMATIF UNINUS
                </span>
              </div>
            </div>
          )}
          <div className="cyanotype-tint-layer" />
          <div className="cyanotype-deep-layer" />
        </div>
        <div className="pt-2 sm:pt-2.5 flex items-center justify-between gap-1.5 font-mono-catalog text-[9px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.14em] text-[#07182B]">
          <span className="truncate font-medium">
            {isChiefRole ? `★ ${member.role}` : member.role}
          </span>
          <span className="text-[#07182B]/65 shrink-0 tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Plakat Nama di Bawah Pigura */}
      <div className="flex flex-col gap-0.5 sm:gap-1 px-0.5">
        <h3 className="font-serif-editorial text-sm sm:text-xl text-[#F2EEE3] leading-snug">
          {member.name}
        </h3>
        <p
          className={`font-mono-catalog text-[10px] sm:text-[11px] uppercase tracking-[0.08em] sm:tracking-[0.12em] ${
            isChiefRole ? 'text-[#F2B35E]' : 'text-[#F2EEE3]/65'
          }`}
        >
          {member.role}
        </p>

        {member.quote && (
          <p className="pt-1.5 sm:pt-2 mt-1 border-t border-[#F2EEE3]/15 font-serif-editorial italic text-xs sm:text-sm text-[#F2EEE3]/80 leading-relaxed">
            “{member.quote}”
          </p>
        )}
      </div>
    </article>
  );
}

export function TentangPage({
  members,
  curatorPhotoUrl,
  closing,
  loading,
  onVideoPlay,
}: TentangPageProps) {
  // Kelompokkan per bagian/departemen sesuai urutan tampil, setiap orang 1 pigura
  const groupedSections: { title: string; items: TeamMember[] }[] = [];
  const groupIndexMap = new Map<string, number>();

  for (const member of members) {
    const groupTitle = (member.division || 'Pengurus').trim();
    const existingIdx = groupIndexMap.get(groupTitle);
    if (existingIdx !== undefined) {
      groupedSections[existingIdx].items.push(member);
    } else {
      groupIndexMap.set(groupTitle, groupedSections.length);
      groupedSections.push({ title: groupTitle, items: [member] });
    }
  }

  let runningIndex = 0;

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-14 py-12 sm:py-20">
      {/* Editorial Catatan Kurator */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pb-16 border-b border-[#F2EEE3]/15">
        <div className="lg:col-span-5">
          <span className="font-mono-catalog text-xs tracking-[0.2em] uppercase text-[#F2B35E] block mb-3">
            Profil Himpunan · 2026/2027
          </span>
          <h1 className="font-serif-editorial text-4xl sm:text-6xl text-[#F2EEE3] leading-[1.02] tracking-tight mb-6">
            Catatan <span className="italic">Kurator</span>
          </h1>
          <div className="passepartout-frame max-w-md">
            <div className="aspect-[4/3] overflow-hidden bg-[#0B2A4A]">
              <img
                src={curatorPhotoUrl || '/src/assets/images/proker1_raker_1795774773977.jpg'}
                alt="Tim Medkominfo HIMATIF UNINUS sedang berdiskusi"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="pt-2.5 flex items-center justify-between font-mono-catalog text-[10px] uppercase tracking-[0.14em] text-[#07182B]">
              <span>ARSIP KURATORIAL</span>
              <span>HIMATIF UNINUS 2026/2027</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-center gap-6">
          <p className="text-base sm:text-lg text-[#F2EEE3]/90 leading-[1.8] max-w-2xl first-letter:font-serif-editorial first-letter:text-5xl first-letter:font-semibold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-[#F2B35E]">
            Departemen Komunikasi dan Informasi (Medkominfo) HIMATIF UNINUS hadir bukan sekadar sebagai pengambil gambar di balik panggung acara, melainkan penjaga ingatan kolektif warga Teknik Informatika.
          </p>
          <p className="text-base text-[#F2EEE3]/75 leading-[1.8] max-w-2xl">
            Terinspirasi dari teknik cetak foto{' '}
            <span className="italic font-serif-editorial text-[#F2EEE3]">
              cyanotype
            </span>{' '}
            abad ke-19—yang memadukan birunya besi Prusia dengan kertas katun krem di bawah sinar matahari—galeri digital ini merangkum perjalanan kepengurusan dan setiap program kerja periode 2026/2027. Tidak tergesa-gesa, terkurasi rapi, dan terbuka untuk dikenang kembali kapan saja.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#F2EEE3]/15 max-w-2xl">
            <div>
              <div className="font-mono-catalog text-[10px] uppercase tracking-[0.16em] text-[#F2B35E]">
                Kabinet
              </div>
              <div className="font-serif-editorial text-xl text-[#F2EEE3] mt-1">
                2026 / 2027
              </div>
            </div>
            <div>
              <div className="font-mono-catalog text-[10px] uppercase tracking-[0.16em] text-[#F2B35E]">
                Kurasi Visual
              </div>
              <div className="font-serif-editorial text-xl text-[#F2EEE3] mt-1">
                Foto & Film
              </div>
            </div>
            <div>
              <div className="font-mono-catalog text-[10px] uppercase tracking-[0.16em] text-[#F2B35E]">
                Jam Buka
              </div>
              <div className="font-serif-editorial text-xl text-[#F2EEE3] mt-1">
                24 Jam Daring
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Galeri Pigura Pengurus (1 Pigura = 1 Orang) */}
      <section className="py-16 border-b border-[#F2EEE3]/15">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="font-mono-catalog text-xs tracking-[0.2em] uppercase text-[#F2B35E] block mb-2">
              Galeri Potret Pengurus · Per Pigura Satu Orang
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-5xl text-[#F2EEE3]">
              Inti Pengurus &amp; <span className="italic">Departemen</span>
            </h2>
          </div>
          <span className="font-mono-catalog text-xs text-[#F2EEE3]/60 uppercase tracking-[0.14em]">
            {members.length} Pengurus Terarsip
          </span>
        </div>

        {loading ? (
          <div className="py-12 font-mono-catalog text-xs uppercase tracking-[0.16em] text-[#F2EEE3]/60">
            Memuat galeri potret pengurus...
          </div>
        ) : members.length === 0 ? (
          <div className="border border-[#F2EEE3]/20 p-10 text-center font-serif-editorial italic text-[#F2EEE3]/70">
            Potret pengurus sedang disiapkan oleh kurator di Panel Admin.
          </div>
        ) : (
          <div className="flex flex-col gap-10 sm:gap-16">
            {groupedSections.map((group, gIdx) => (
              <div key={group.title} className="flex flex-col gap-4 sm:gap-7">
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#F2EEE3]/15 pb-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono-catalog text-xs uppercase tracking-[0.18em] text-[#F2B35E] tabular-nums">
                      {String(gIdx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-serif-editorial text-xl sm:text-3xl text-[#F2EEE3]">
                      {group.title}
                    </h3>
                  </div>
                  <span className="font-mono-catalog text-[11px] uppercase tracking-[0.14em] text-[#F2EEE3]/55 tabular-nums">
                    {group.items.length} Pigura
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-8">
                  {group.items.map((member) => {
                    const cardIndex = runningIndex++;
                    return (
                      <FramedMemberCard
                        key={member.id}
                        member={member}
                        index={cardIndex}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Foto Bersama & Epilog Penutup */}
      <ClosingEpilogue closing={closing} onVideoPlay={onVideoPlay} />

      {/* Kontak & Lokasi */}
      <section className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#F2EEE3] text-[#07182B] p-6">
          <div className="flex items-center gap-2 font-mono-catalog text-[11px] uppercase tracking-[0.16em] text-[#1D4E89] mb-2">
            <Mail className="w-4 h-4" />
            <span>Surel Redaksi</span>
          </div>
          <p className="font-serif-editorial text-xl">medkominfo@himatif.org</p>
          <p className="text-xs text-[#07182B]/70 mt-1">
            Untuk arsip dokumentasi, kerja sama publikasi, atau permintaan foto asli.
          </p>
        </div>

        <div className="border border-[#F2EEE3]/20 bg-[#0B2A4A]/50 p-6">
          <div className="flex items-center gap-2 font-mono-catalog text-[11px] uppercase tracking-[0.16em] text-[#F2B35E] mb-2">
            <Instagram className="w-4 h-4" />
            <span>Kanal Publikasi</span>
          </div>
          <p className="font-serif-editorial text-xl text-[#F2EEE3]">
            @himatif.uninus
          </p>
          <p className="text-xs text-[#F2EEE3]/65 mt-1">
            Pembaruan seputar program kerja, informasi organisasi, dan dokumentasi kegiatan.
          </p>
        </div>

        <div className="border border-[#F2EEE3]/20 bg-[#0B2A4A]/50 p-6">
          <div className="flex items-center gap-2 font-mono-catalog text-[11px] uppercase tracking-[0.16em] text-[#F2B35E] mb-2">
            <MapPin className="w-4 h-4" />
            <span>Sekretariat</span>
          </div>
          <p className="font-serif-editorial text-xl text-[#F2EEE3]">
            HIMATIF UNINUS
          </p>
          <p className="text-xs text-[#F2EEE3]/65 mt-1">
            Universitas Islam Nusantara · Ruang Kesekretariatan Himpunan Mahasiswa Teknik Informatika.
          </p>
        </div>
      </section>
    </div>
  );
}

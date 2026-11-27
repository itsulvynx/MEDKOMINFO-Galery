import { count } from 'drizzle-orm';
import { db } from './index.ts';
import {
  adminWhitelist,
  appSettings,
  artworks,
  comments,
  likes,
  prokers,
  quotes,
  reactions,
  teamMembers,
} from './schema.ts';

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null;
      console.error('Seed error:', err);
    });
  }
  return seedPromise;
}

async function runSeed(): Promise<void> {
  // Always ensure primary admin whitelist exists if table is empty
  const [{ value: whitelistCount }] = await db
    .select({ value: count() })
    .from(adminWhitelist);

  if (Number(whitelistCount) === 0) {
    await db
      .insert(adminWhitelist)
      .values([
        {
          email: 'auliyyasalwa@gmail.com',
          role: 'super_admin',
          addedBy: 'system',
        },
        {
          email: 'medkominfo@himatif.org',
          role: 'admin',
          addedBy: 'system',
        },
      ])
      .onConflictDoNothing();
  }

  // Ensure default settings
  await db
    .insert(appSettings)
    .values([
      { key: 'guestbook_auto_approve', value: 'false' },
      { key: 'visitor_counter', value: '1' },
      { key: 'backsound_mode', value: 'builtin' },
      { key: 'backsound_url', value: '' },
      { key: 'backsound_title', value: 'Piano Latar Museum' },
      { key: 'curator_photo_url', value: '/src/assets/images/proker1_raker_1795774773977.jpg' },
      { key: 'closing_visible', value: 'true' },
      { key: 'closing_title', value: 'Epilog Kabinet · Kisah Perjalanan Kita' },
      { key: 'closing_subtitle', value: 'Foto Bersama & Film Penutup Periode 2026/2027' },
      { key: 'closing_photo_url', value: '/src/assets/images/foto_bersama_akhir_1795791766079.jpg' },
      {
        key: 'closing_photo_caption',
        value:
          'Seluruh keluarga besar Medkominfo HIMATIF UNINUS 2026/2027 setelah menuntaskan seluruh program kerja.',
      },
      { key: 'closing_video_url', value: 'https://www.youtube.com/watch?v=M7lc1UVf-VE' },
      { key: 'closing_video_title', value: 'Film Perjalanan Kita — Kabinet 2026/2027' },
      {
        key: 'closing_message',
        value:
          'Terima kasih telah berjalan bersama melewati setiap malam lembur, tawa di balik kamera, dan cerita yang sempat hampir terlewat. Periode boleh berganti, tetapi setiap bingkai di museum ini akan selalu menjadi rumah bagi kenangan kita.',
      },
    ])
    .onConflictDoNothing();

  // Check if prokers already exist
  const [{ value: prokerCount }] = await db
    .select({ value: count() })
    .from(prokers);

  if (Number(prokerCount) > 0) {
    return;
  }

  // Seed quotes for Lobi Hidup
  await db.insert(quotes).values([
    {
      text: 'Kamera boleh kehabisan baterai, asal cerita jangan pernah berhenti dicetak.',
      author: 'Kurator Medkominfo 2026/2027',
      isActive: true,
    },
    {
      text: 'Di balik satu unggahan yang rapi, ada tiga belas revisi warna biru dan dua gelas es kopi.',
      author: 'Divisi Desain Visual',
      isActive: true,
    },
    {
      text: 'Cetak cyanotype mengajarkan kita: bayangan gelap adalah bagian penting agar cahaya punya arti.',
      author: 'Arsiparis HIMATIF',
      isActive: true,
    },
    {
      text: 'Setiap momen di himpunan terlalu berharga untuk sekadar tenggelam di folder tautan.',
      author: 'Tim Dokumentasi & Sinema',
      isActive: true,
    },
  ]);

  // Seed team members (1 pigura per orang)
  await db.insert(teamMembers).values([
    { name: 'Muhammad Aqmal Madani', role: 'Ketua Himpunan', division: 'Inti Pengurus', photoUrl: null, isLeader: true, quote: null, sortOrder: 1 },
    { name: 'Muhammad Adzka Fauzan', role: 'Wakil Ketua', division: 'Inti Pengurus', photoUrl: null, isLeader: true, quote: null, sortOrder: 2 },
    { name: 'Rianti Nuraeni', role: 'Sekretaris', division: 'Inti Pengurus', photoUrl: null, isLeader: true, quote: null, sortOrder: 3 },
    { name: 'Gina Sophiaan', role: 'Bendahara', division: 'Inti Pengurus', photoUrl: null, isLeader: true, quote: null, sortOrder: 4 },
    { name: 'Muhamad Rizky Kholil', role: 'Kepala Departemen', division: 'Departemen Penelitian dan Pengembangan', photoUrl: null, isLeader: false, quote: null, sortOrder: 5 },
    { name: 'Syahdan Ardiansyah', role: 'Anggota', division: 'Departemen Penelitian dan Pengembangan', photoUrl: null, isLeader: false, quote: null, sortOrder: 6 },
    { name: 'Muhammad Sigit Nurjaman', role: 'Anggota', division: 'Departemen Penelitian dan Pengembangan', photoUrl: null, isLeader: false, quote: null, sortOrder: 7 },
    { name: 'Deviana Raya Amalia', role: 'Anggota', division: 'Departemen Penelitian dan Pengembangan', photoUrl: null, isLeader: false, quote: null, sortOrder: 8 },
    { name: 'Deviani Raya Amalia', role: 'Anggota', division: 'Departemen Penelitian dan Pengembangan', photoUrl: null, isLeader: false, quote: null, sortOrder: 9 },
    { name: 'Lucky Kandariyana Nugraha', role: 'Anggota', division: 'Departemen Penelitian dan Pengembangan', photoUrl: null, isLeader: false, quote: null, sortOrder: 10 },
    { name: 'Lukman Hakim', role: 'Anggota', division: 'Departemen Penelitian dan Pengembangan', photoUrl: null, isLeader: false, quote: null, sortOrder: 11 },
    { name: 'Pinkhan Kholifatur Ristiantoro', role: 'Anggota', division: 'Departemen Penelitian dan Pengembangan', photoUrl: null, isLeader: false, quote: null, sortOrder: 12 },
    { name: 'Muhammad Irwansyah Putra Anugrah', role: 'Anggota', division: 'Departemen Penelitian dan Pengembangan', photoUrl: null, isLeader: false, quote: null, sortOrder: 13 },
    { name: 'Rafi Fauzan', role: 'Kepala Departemen', division: 'Departemen Kominfo', photoUrl: null, isLeader: false, quote: null, sortOrder: 14 },
    { name: 'Afrizal Andriansyah', role: 'Anggota', division: 'Departemen Kominfo', photoUrl: null, isLeader: false, quote: null, sortOrder: 15 },
    { name: 'Salma Muhsinah Malihah', role: 'Anggota', division: 'Departemen Kominfo', photoUrl: null, isLeader: false, quote: null, sortOrder: 16 },
    { name: 'Salwa Auliyya Nisya', role: 'Anggota', division: 'Departemen Kominfo', photoUrl: null, isLeader: false, quote: null, sortOrder: 17 },
    { name: 'Suci Nurhayani', role: 'Anggota', division: 'Departemen Kominfo', photoUrl: null, isLeader: false, quote: null, sortOrder: 18 },
    { name: 'Jujun Abdul Latif', role: 'Anggota', division: 'Departemen Kominfo', photoUrl: null, isLeader: false, quote: null, sortOrder: 19 },
    { name: 'Nabil Muhammad Apsan', role: 'Kepala Departemen', division: 'Departemen PSDM', photoUrl: null, isLeader: false, quote: null, sortOrder: 20 },
    { name: 'M Zavad Adzdzikri', role: 'Anggota', division: 'Departemen PSDM', photoUrl: null, isLeader: false, quote: null, sortOrder: 21 },
    { name: 'Cep Rifky Maulana', role: 'Anggota', division: 'Departemen PSDM', photoUrl: null, isLeader: false, quote: null, sortOrder: 22 },
    { name: 'Revan Maulana', role: 'Anggota', division: 'Departemen PSDM', photoUrl: null, isLeader: false, quote: null, sortOrder: 23 },
    { name: 'Nabila Keisya Azahrra', role: 'Anggota', division: 'Departemen PSDM', photoUrl: null, isLeader: false, quote: null, sortOrder: 24 },
    { name: 'Arya Sidik Permana', role: 'Anggota', division: 'Departemen PSDM', photoUrl: null, isLeader: false, quote: null, sortOrder: 25 },
  ]);

  // Seed 3 prokers
  const insertedProkers = await db
    .insert(prokers)
    .values([
      {
        roomNumber: 'RUANG 01',
        slug: 'pelantikan-raker-2026',
        title: 'Pelantikan & Rapat Kerja Kabinet',
        subtitle: 'Babak Pertama Kepengurusan 2026/2027',
        description:
          'Momen sakral serah terima amanah kabinet baru HIMATIF periode 2026/2027 yang dilanjutkan dengan rapat kerja maraton merumuskan arah gerak setahun ke depan. Dari sumpah jabatan di auditorium hingga coretan rencana di meja kayu sekretariat.',
        curatorNote:
          'Hari pertama memegang kamera sebagai pengurus baru selalu terasa canggung—tapi justru di sanalah kejujuran setiap bingkai lahir.',
        closingNote:
          'Terima kasih sudah mampir di Ruang 01. Perjalanan satu periode baru saja dimulai!',
        eventDate: '18 Oktober 2026',
        coverUrl: '/src/assets/images/proker1_pelantikan_1795774774073.jpg',
        sortOrder: 1,
        isVisible: true,
      },
      {
        roomNumber: 'RUANG 02',
        slug: 'ifest-hackathon-2026',
        title: 'IFEST & Hackathon Inovasi Kampus',
        subtitle: 'Pekan Teknologi, Seminar & 24 Jam Merangkai Kode',
        description:
          'Perayaan tahunan terbesar Informatika yang mempertemukan mahasiswa, praktisi teknologi, dan tim-tim hackathon dalam maraton inovasi 24 jam. Lampu aula tidak pernah padam—begitu juga semangat para peserta dan kru dokumentasi.',
        curatorNote:
          'Memotret hackathon jam dua pagi itu soal menangkap mata yang lelah tapi tetap berbinar saat kode akhirnya berjalan tanpa galat.',
        closingNote:
          'Terima kasih sudah mampir di Ruang 02. Jangan lupa istirahatkan mata sejenak dari layar.',
        eventDate: '14 November 2026',
        coverUrl: '/src/assets/images/proker2_hackathon_1795774775419.jpg',
        sortOrder: 2,
        isVisible: true,
      },
      {
        roomNumber: 'RUANG 03',
        slug: 'makrab-pengabdian-desa',
        title: 'Makrab & Ekspedisi Desa Digital',
        subtitle: 'Literasi Teknologi dan Malam Keakraban Angkatan',
        description:
          'Dua hari meninggalkan bisingnya kampus untuk berbagi ilmu literasi digital bersama warga desa, lalu menutup malam di bawah langit biru dengan api unggun, gitar akustik, dan obrolan hangat antar angkatan.',
        curatorNote:
          'Cahaya terbaik tidak selalu datang dari studio—terkadang cukup dari pendopo kayu dan lentera api unggun.',
        closingNote:
          'Terima kasih sudah mampir di Ruang 03. Sampai jumpa di ekspedisi berikutnya!',
        eventDate: '20 Desember 2026',
        coverUrl: '/src/assets/images/proker3_pengabdian_1795774776638.jpg',
        sortOrder: 3,
        isVisible: true,
      },
    ])
    .returning();

  const [p1, p2, p3] = insertedProkers;

  // Seed artworks across the 3 prokers
  const insertedArtworks = await db
    .insert(artworks)
    .values([
      {
        prokerId: p1.id,
        catalogNumber: 'KAT. 01-A',
        mediaType: 'image',
        mediaUrl: '/src/assets/images/proker1_pelantikan_1795774774073.jpg',
        title: 'Sumpah Kabinet di Bawah Sorot Lampu',
        caption:
          'Barisan pengurus HIMATIF 2026/2027 membacakan ikrar jabatan di panggung auditorium kampus.',
        curatorQuote:
          'Lampu sorot panggung memberi warna amber alami tepat saat naskah ikrar dibuka.',
        capturedDate: '18 Okt 2026',
        aspectRatio: '16:9',
        isHighlight: true,
        sortOrder: 1,
      },
      {
        prokerId: p1.id,
        catalogNumber: 'KAT. 01-B',
        mediaType: 'image',
        mediaUrl: '/src/assets/images/proker1_raker_1795774773977.jpg',
        title: 'Meja Rapat & Draf Awal Proker',
        caption:
          'Diskusi perdana departemen Medkominfo menyusun kalender redaksi, kamera, dan konsep pameran.',
        curatorQuote:
          'Catatan tulis tangan di atas meja kayu sering kali lebih jujur daripada slide presentasi.',
        capturedDate: '21 Okt 2026',
        aspectRatio: '4:3',
        isHighlight: true,
        sortOrder: 2,
      },
      {
        prokerId: p1.id,
        catalogNumber: 'KAT. 01-C',
        mediaType: 'video',
        mediaUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
        thumbnailUrl: '/src/assets/images/proker1_pelantikan_1795774774073.jpg',
        title: 'Aftermovie Pelantikan & Raker 2026',
        caption:
          'Cuplikan perjalanan hari pertama kepengurusan hingga penutupan rapat kerja kabinet.',
        curatorQuote: 'Direkam dengan dua kamera tangan tanpa stabilizer.',
        capturedDate: '22 Okt 2026',
        aspectRatio: '16:9',
        isHighlight: false,
        sortOrder: 3,
      },
      {
        prokerId: p2.id,
        catalogNumber: 'KAT. 02-A',
        mediaType: 'image',
        mediaUrl: '/src/assets/images/proker2_hackathon_1795774775419.jpg',
        title: 'Arena Hackathon Pukul 23.00 WIB',
        caption:
          'Puluhan tim bertahan di aula utama menuntaskan purwarupa aplikasi sebelum batas waktu pagi.',
        curatorQuote:
          'Perpaduan cahaya biru layar proyektor dan lampu meja kuning membuat aula terasa seperti ruang gelap cetak foto.',
        capturedDate: '14 Nov 2026',
        aspectRatio: '16:9',
        isHighlight: true,
        sortOrder: 1,
      },
      {
        prokerId: p2.id,
        catalogNumber: 'KAT. 02-B',
        mediaType: 'image',
        mediaUrl: '/src/assets/images/proker2_coding_sprint_1795774776147.jpg',
        title: 'Sketsa Wireframe & Kopi Tengah Malam',
        caption:
          'Coretan alur antarmuka di buku kotak-kotak sebelum diterjemahkan menjadi baris kode.',
        curatorQuote:
          'Kopi kaleng kedua di samping laptop adalah saksi bisu fitur yang akhirnya jalan.',
        capturedDate: '15 Nov 2026',
        aspectRatio: '4:3',
        isHighlight: false,
        sortOrder: 2,
      },
      {
        prokerId: p2.id,
        catalogNumber: 'KAT. 02-C',
        mediaType: 'video',
        mediaUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
        thumbnailUrl: '/src/assets/images/proker2_coding_sprint_1795774776147.jpg',
        title: 'Rekap 24 Jam IFEST Hackathon',
        caption:
          'Dokumentasi singkat dari pembukaan seminar teknologi hingga pengumuman juara di panggung utama.',
        curatorQuote: null,
        capturedDate: '16 Nov 2026',
        aspectRatio: '16:9',
        isHighlight: false,
        sortOrder: 3,
      },
      {
        prokerId: p3.id,
        catalogNumber: 'KAT. 03-A',
        mediaType: 'image',
        mediaUrl: '/src/assets/images/proker3_pengabdian_1795774776638.jpg',
        title: 'Kelas Literasi Digital di Pendopo Desa',
        caption:
          'Tawa hangat warga desa dan mahasiswa saat mempraktikkan keamanan internet bersama di pendopo.',
        curatorQuote:
          'Momen terbaik pengabdian adalah saat layar laptop menjadi jembatan cerita antar generasi.',
        capturedDate: '20 Des 2026',
        aspectRatio: '16:9',
        isHighlight: true,
        sortOrder: 1,
      },
      {
        prokerId: p3.id,
        catalogNumber: 'KAT. 03-B',
        mediaType: 'image',
        mediaUrl: '/src/assets/images/proker3_makrab_1795774776222.jpg',
        title: 'Gitar, Lentera, dan Langit Biru Prusia',
        caption:
          'Malam keakraban penutup tahun di halaman perkemahan dengan nyanyian bersama di sekitar api unggun.',
        curatorQuote:
          'Langit senja biru Prusia dan cahaya lentera—persis seperti palet museum ini.',
        capturedDate: '21 Des 2026',
        aspectRatio: '3:4',
        isHighlight: false,
        sortOrder: 2,
      },
      {
        prokerId: p3.id,
        catalogNumber: 'KAT. 03-C',
        mediaType: 'video',
        mediaUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
        thumbnailUrl: '/src/assets/images/proker3_makrab_1795774776222.jpg',
        title: 'Catatan Perjalanan Desa Digital',
        caption:
          'Video dokumenter mini merekam suara warga, perjalanan menuju desa, dan malam keakraban.',
        curatorQuote: 'Putar dengan volume penuh untuk mendengar suara gitar di akhir klip.',
        capturedDate: '22 Des 2026',
        aspectRatio: '16:9',
        isHighlight: false,
        sortOrder: 3,
      },
    ])
    .returning();

  // Seed initial stempel likes so Lobi "Paling Banyak Distempel" has rich data
  const seedLikes: { targetType: string; targetId: number; deviceId: string }[] = [
    { targetType: 'artwork', targetId: insertedArtworks[0].id, deviceId: 'seed-1' },
    { targetType: 'artwork', targetId: insertedArtworks[0].id, deviceId: 'seed-2' },
    { targetType: 'artwork', targetId: insertedArtworks[0].id, deviceId: 'seed-3' },
    { targetType: 'artwork', targetId: insertedArtworks[3].id, deviceId: 'seed-1' },
    { targetType: 'artwork', targetId: insertedArtworks[3].id, deviceId: 'seed-2' },
    { targetType: 'artwork', targetId: insertedArtworks[6].id, deviceId: 'seed-1' },
    { targetType: 'artwork', targetId: insertedArtworks[6].id, deviceId: 'seed-2' },
    { targetType: 'artwork', targetId: insertedArtworks[6].id, deviceId: 'seed-3' },
    { targetType: 'artwork', targetId: insertedArtworks[6].id, deviceId: 'seed-4' },
    { targetType: 'artwork', targetId: insertedArtworks[7].id, deviceId: 'seed-1' },
    { targetType: 'proker', targetId: p1.id, deviceId: 'seed-1' },
    { targetType: 'proker', targetId: p2.id, deviceId: 'seed-1' },
    { targetType: 'proker', targetId: p3.id, deviceId: 'seed-1' },
  ];
  await db.insert(likes).values(seedLikes).onConflictDoNothing();

  // Seed initial reactions
  await db
    .insert(reactions)
    .values([
      { artworkId: insertedArtworks[0].id, emoji: '🔥', deviceId: 'seed-1' },
      { artworkId: insertedArtworks[0].id, emoji: '👏', deviceId: 'seed-2' },
      { artworkId: insertedArtworks[3].id, emoji: '🔥', deviceId: 'seed-1' },
      { artworkId: insertedArtworks[4].id, emoji: '😂', deviceId: 'seed-1' },
      { artworkId: insertedArtworks[6].id, emoji: '🥹', deviceId: 'seed-1' },
      { artworkId: insertedArtworks[6].id, emoji: '😍', deviceId: 'seed-2' },
      { artworkId: insertedArtworks[7].id, emoji: '🥹', deviceId: 'seed-1' },
    ])
    .onConflictDoNothing();

  // Seed approved guestbook postcards
  await db.insert(comments).values([
    {
      prokerId: p1.id,
      authorName: "Raka '24",
      message: 'Aura pelantikannya kerasa banget! Semangat terus kabinet 2026/2027 dan kru Medkominfo!',
      sticker: '📸',
      status: 'approved',
      deviceId: 'seed-guest-1',
    },
    {
      prokerId: p1.id,
      authorName: 'Dinda',
      message: 'Meja raker yang berantakan tapi estetik itu valid banget sih haha.',
      sticker: '✨',
      status: 'approved',
      deviceId: 'seed-guest-2',
    },
    {
      prokerId: p2.id,
      authorName: 'Pengunjung Anonim',
      message: 'Foto kopi sama wireframe jam 2 pagi bikin nostalgia pas begadang ngerjain tubes.',
      sticker: '☕',
      status: 'approved',
      deviceId: 'seed-guest-3',
    },
    {
      prokerId: p3.id,
      authorName: 'Bima (Alumni)',
      message: 'Melihat senyum warga di pendopo bikin bangga jadi bagian dari HIMATIF!',
      sticker: '🌿',
      status: 'approved',
      deviceId: 'seed-guest-4',
    },
    {
      prokerId: p3.id,
      authorName: 'Laras',
      message: 'Foto api unggunnya cocok banget dijadiin cetakan kartu pos beneran.',
      sticker: '💌',
      status: 'approved',
      deviceId: 'seed-guest-5',
    },
  ]);
}

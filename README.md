# Penghitung IPS dan IPK

Aplikasi Next.js untuk menghitung IPS/IPK, menyimpan data per mahasiswa di Firebase, dan mengelola akun melalui panel admin. Nilai **D berbobot 1 dan E berbobot 0 pada IPS/IPK**, tetapi keduanya tidak menambah SKS lulus. Jika mata kuliah diulang, percobaan terbaru dengan nama mata kuliah yang sama dipakai pada IPK kumulatif.

Modul CPL menghubungkan mata kuliah → CPMK → CPL → profil lulusan. Nilai CPL dihitung sebagai rata-rata nilai CPMK pada skala 0–100 dan dibandingkan dengan target program studi.

## Menjalankan lokal

1. Buat project Firebase, aktifkan **Authentication > Email/Password**, dan buat database **Cloud Firestore**.
2. Salin `.env.example` menjadi `.env.local`, lalu isi konfigurasi Firebase Web dan service account Firebase Admin.
3. Jalankan `npm install`, `npx firebase-tools deploy --only firestore:rules`, lalu `npm run dev`.

## Membuat admin pertama

Setelah environment Firebase Admin tersedia, jalankan:

```bash
node scripts/create-admin.mjs 12345678 "Administrator" password-kuat
```

Import kurikulum Teknik Elektro dari workbook resmi:

```bash
node scripts/import-curriculum.mjs "C:\path\Template-Kurikulum.xlsx"
```

NIM dipetakan internal menjadi email sintetis Firebase; pengguna tetap hanya memasukkan NIM.

## Deploy ke Vercel

Import repository ke Vercel, tambahkan seluruh variabel dari `.env.example`, lalu deploy. Untuk `FIREBASE_PRIVATE_KEY`, pertahankan `\n` di dalam nilainya. Deploy `firestore.rules` ke Firebase secara terpisah sebelum aplikasi digunakan.

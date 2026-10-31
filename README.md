# Rony Asmara — Portofolio

<img src="assets/images/pp.webp" alt="Foto profil Rony Asmara" width="112">

Portofolio pribadi Rony Asmara yang menampilkan pengalaman dalam infrastruktur TI, dukungan teknis, layanan bantuan TI, dan pengembangan aplikasi web.

Situs dibangun dengan HTML, CSS, dan JavaScript tanpa kerangka kerja atau proses kompilasi.

**Portofolio:** [devasmaradev.github.io](https://devasmaradev.github.io/)

## Fitur

- Tampilan responsif untuk perangkat seluler, tablet, dan desktop.
- Pilihan bahasa Indonesia dan Inggris.
- Tema terang dan gelap dengan preferensi yang tersimpan di peramban.
- Ringkasan pengalaman kerja, pendidikan, kompetensi, dan layanan.
- Detail proyek, studi kasus, dan galeri tangkapan layar.
- Navigasi galeri menggunakan tombol panah dan penutupan dengan tombol Escape.
- Formulir kontak dengan validasi, status pengiriman, dan penanganan kegagalan.
- Animasi aurora pada bagian pembuka.

## Proyek yang Ditampilkan

| Proyek | Ringkasan |
| --- | --- |
| Bookmark Manager | Pengelola markah dengan penyimpanan lokal menggunakan IndexedDB. |
| InstaAnalyzer | Analisis berkas ekspor Instagram yang diproses secara lokal di peramban. |
| SPK Prioritas Wilayah Pengasapan | Sistem pendukung keputusan menggunakan metode TOPSIS. |
| SPK Pemilihan Lahan Pertanian Jahe | Sistem pendukung keputusan menggunakan metode AHP dan TOPSIS. |

Portofolio juga memuat proyek magang, proyek akademik, dan kontribusi pengembangan antarmuka lainnya.

## Teknologi

- **HTML:** struktur semantik, konten, dan metadata.
- **CSS:** tata letak responsif, tipografi, tema, dan animasi.
- **JavaScript:** navigasi, terjemahan, preferensi pengguna, galeri, dan formulir.
- **Lucide:** ikon SVG yang ditanam langsung di HTML.
- **WebP:** foto profil dan tangkapan layar yang digunakan pada halaman.
- **Formspree:** layanan eksternal untuk pengiriman formulir kontak.

## Struktur Publikasi

```text
.
├── README.md
├── index.html
├── style.css
├── script.js
└── assets/
    ├── images/
    │   └── foto profil dan tangkapan layar proyek
    └── lucide/
        ├── favicon.svg
        └── LICENSE
```

Pertahankan nama dan susunan folder tersebut agar referensi gambar, favicon, CSS, dan JavaScript tetap sesuai. Folder `docs` dan `tests`, jika disertakan dari salinan pengembangan, tidak diperlukan untuk menjalankan situs.

## Menjalankan Secara Lokal

Buka folder proyek di Visual Studio Code, lalu jalankan ekstensi Live Server. Sebagai alternatif, jika Python tersedia, jalankan perintah berikut dari folder proyek:

```sh
python -m http.server 8000
```

Buka [http://localhost:8000](http://localhost:8000) di peramban. Python hanya digunakan sebagai server pratinjau lokal; situs yang dipublikasikan tetap berupa berkas statis.

## Publikasi melalui GitHub Pages

1. Unggah struktur publikasi di atas ke folder utama repositori.
2. Buka **Settings → Pages** pada repositori.
3. Pada **Build and deployment**, pilih **Deploy from a branch**.
4. Pilih cabang yang berisi situs, misalnya `main`, dan folder **/(root)**.
5. Simpan pengaturan, lalu tunggu proses publikasi selesai.

Ikuti [panduan resmi GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) untuk pengaturan sumber publikasi.

Jika menggunakan alamat repositori atau domain yang berbeda, sesuaikan alamat kanonis, metadata berbagi, dan URL pada data terstruktur di `index.html`.

## Penyesuaian Konten

| Bagian | Berkas |
| --- | --- |
| Struktur halaman, tautan, metadata, dan gambar | `index.html` |
| Warna, ukuran, tata letak, dan tampilan responsif | `style.css` |
| Terjemahan, studi kasus, dan perilaku interaktif | `script.js` |
| Foto profil dan tangkapan layar | `assets/images/` |

Pengiriman formulir memerlukan koneksi internet dan konfigurasi Formspree yang sesuai. Jika menggunakan proyek ini untuk portofolio lain, ganti tujuan pengiriman formulir serta identitas dan tautan profilnya. Font Inter dimuat melalui Google Fonts, dengan font cadangan ketika layanan tersebut tidak tersedia.

## Pengujian pada Salinan Pengembangan

Jika folder `tests` disertakan, pengujian browser dapat dijalankan dengan Python dan Playwright:

```sh
python -m pip install playwright
python -m playwright install chromium
python tests/portfolio_smoke.py
python tests/portfolio_edge_cases.py
```

Tes mencakup tata letak, navigasi, galeri, preferensi bahasa dan tema, serta kondisi formulir. Pengiriman formulir dalam tes menggunakan simulasi dan tidak mengirim pesan sungguhan.

## Atribusi

Ikon berasal dari [Lucide](https://lucide.dev/). Salinan sumber ikon dan favicon disertai [ketentuan lisensi dan atribusi](assets/lucide/LICENSE). Ikon antarmuka ditanam langsung di HTML sehingga tidak memerlukan pustaka ikon dari CDN saat halaman dibuka.

---

**Rony Asmara** · [GitHub](https://github.com/devasmaradev) · [LinkedIn](https://www.linkedin.com/in/ronyasmara/)

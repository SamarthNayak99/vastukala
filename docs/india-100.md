# India catalogue expansion

The catalogue now includes 100 published monuments at 73 heritage locations across 21 states and union territories. This batch adds 40 records to the existing 60. Karnataka has 32 entries after the addition of Mysore Palace and Gol Gumbaz.

The 40 additions have 43 licensed photographs, 43 reviewed hotspots, and 59 sourced events. The full archive contains 135 approved photographs, 110 hotspots, and 116 events.

| State or union territory | Added monuments |
| --- | --- |
| Andaman and Nicobar Islands | Cellular Jail |
| Andhra Pradesh | Sri Venkateswara Temple, Tirumala<br>Veerabhadra Temple, Lepakshi |
| Arunachal Pradesh | Tawang Monastery |
| Delhi | Lotus Temple<br>Jama Masjid, Delhi<br>India Gate |
| Gujarat | Somnath Temple<br>Dwarkadhish Temple<br>Dholavira Harappan City<br>Jami Masjid, Champaner<br>Sidi Saiyyed Mosque |
| Karnataka | Mysore Palace<br>Gol Gumbaz |
| Kerala | Mattancherry Palace |
| Ladakh | Leh Palace |
| Madhya Pradesh | Gwalior Fort<br>Jahaz Mahal, Mandu<br>Jahangir Mahal, Orchha |
| Maharashtra | Chhatrapati Shivaji Maharaj Terminus<br>Gateway of India |
| Odisha | Jagannath Temple, Puri<br>Lingaraj Temple |
| Rajasthan | Jantar Mantar, Jaipur<br>Chittorgarh Fort<br>Kumbhalgarh Fort<br>Mehrangarh Fort<br>Ranakpur Jain Temple<br>Dilwara Jain Temples |
| Tamil Nadu | Brihadisvara Temple, Gangaikonda Cholapuram<br>Ranganathaswamy Temple, Srirangam<br>Ramanathaswamy Temple<br>Kailasanatha Temple, Kanchipuram |
| Telangana | Ramappa Temple<br>Golconda Fort<br>Qutb Shahi Tombs |
| Uttar Pradesh | Dhamek Stupa<br>Bara Imambara<br>Kashi Vishwanath Temple |
| West Bengal | Rasmancha, Bishnupur |

## Research and coverage

- The additions represent a curated selection of prominent omissions, with examples of fortifications, temples, mosques, palaces, civic monuments, a railway station, an observatory, and a colonial prison. The Lotus Temple and reconstructed Somnath shrine document notable modern building phases alongside earlier monuments.
- Each profile links its architectural claims and dates to government, institutional, or World Heritage Centre sources. Tentative-list entries are referenced as research dossiers. An inscription on the World Heritage List appears as a separate event where applicable.
- The map uses approximate reference points. When multiple buildings share a site, their individual pins remain distinct at closer zoom levels.
- Photograph credits and reuse terms are stored per image. Hotspot coordinates refer to the orientation-corrected, uncropped image.

## Load the additions locally

From the project root, prepare the credited photographs with `npm run media:fetch`, then start with `npm run dev`. A running local instance can import the additions with `npm run db:seed` after the photographs are ready. Seeding preserves existing catalogue records and their edits.

The same state and site filters, cited comparisons, anatomy viewer, timeline, photo viewer, statistics, and DBMS Lab queries include the new entries. Migration 007 extends the event year bounds to 4000 BCE, which accommodates Dholavira's documented occupation range.

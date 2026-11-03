'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './meadow-tabs.module.css';

export default function MeadowTabs({classPlay}:{classPlay:boolean}) {
  const pathname=usePathname();
  const bebras=pathname.startsWith('/play/mouse/bebras');
  return <nav className={styles.tabs} aria-label="Mouse Meadow activities">
    <Link href={classPlay?'/play/mouse/class':'/play/mouse'} aria-current={!bebras?'page':undefined}>🌻 Mouse Meadow</Link>
    <Link href="/play/mouse/bebras" aria-current={bebras?'page':undefined}>🧩 Bebras challenges</Link>
  </nav>;
}

import './index.ts';

const park = document.querySelector('cursor-park')!;

for (let i = 0; i < 40; i++) {
  const grass = document.createElement('cursor-grass');
  const x = Math.floor(Math.random() * 2000);
  const y = Math.floor(Math.random() * 2000);
  grass.style.top = y + 'px';
  grass.style.left = x + 'px';
  park.appendChild(grass);
}

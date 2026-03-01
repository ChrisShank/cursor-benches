import './index.ts';

function promptInstruction() {
  const alreadyPrompted = localStorage.getItem('prompt');
  console.log(alreadyPrompted);
  if (alreadyPrompted !== 'true') {
    alert(
      `Instructions: You cursor can interact with objects throughout the park.

- Clicking on an object lets you interact with it.
- Clicking the same object will reclaim it.
- At any time you can interact with another object.`,
    );
    localStorage.setItem('prompt', 'true');
  }
}

setTimeout(promptInstruction, 300);

const park = document.querySelector('cursor-park')!;
document.addEventListener(
  'dblclick',
  (e) => {
    e.preventDefault();
    e.stopPropagation();
    const bush = document.createElement('cursor-flowers');
    bush.style.top = e.pageY + 'px';
    bush.style.left = e.pageX + 'px';
    park.appendChild(bush);
  },
  { capture: true },
);

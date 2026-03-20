import './index.ts';

function promptInstruction() {
  const alreadyPrompted = localStorage.getItem('prompt');

  if (alreadyPrompted !== 'true') {
    alert(
      `Instructions: Your cursor can interact with objects throughout the park.

- Clicking on an object lets you interact with it.
- Clicking the same object will reclaim it.
- At any time you can interact with another object.`,
    );
    localStorage.setItem('prompt', 'true');
  }
}

setTimeout(promptInstruction, 300);

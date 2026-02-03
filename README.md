# Cursor Parks

## Getting Started

To add a cursor park just need to import the `cursor-park` library that defines the custom HTML element and add them to the body of your web page.

```html
<body>
  <cursor-park>
    <cursor-bench></cursor-bench>
  </cursor-park>

  <script type="module">
    import 'cursor-park';
  </script>
</body>
```

# Background

The [conception](https://www.superkids.com/aweb/pages/features/mouse/mouse.html) of the computer mouse unequivocally changed our relationship to the computer. The movements of our hands became directly translated into cyberspace through tiny digital projections called mouse cursors. Over time, our relationship with mouse cursors evolved beyond extension, towards embodiment. As we have come to frequently co-habituate software in realtime, cursors have become the defacto means to indicate our presence to others – they have come to directly signify ourselves to our peers. Yet something feels off, our presence as embodied through cursors are ghosts, inert, inexpressive, and, at times, [overwhelming](https://maggieappleton.com/ambient-copresence). Worst of all, our cursors (and thus ourselves) live under [constant surveillance](https://www.semanticscholar.org/paper/What-can-a-mouse-cursor-tell-us-more%3A-correlation-Chen-Anderson/4b0771ee0a3417aae94643fcaaabfd922367f8f5), trying to infer our intentions, thoughts, and emotions.

This project reimagines our relationship to the mouse cursor.

Mouse cursors began contextualizing the actions we can take, sometimes as little hands, sometimes warning us when we can't interact with something.

[AI browsers](https://www.youtube.com/live/8UWKxJbjriY?t=850s) aims to [take control of our cursors](https://youtu.be/C25g53PC5QQ?si=iAM2WVop6RmokwJR&t=346)

[the double life of cursor watching](https://www.codame.com/p/cursor-watching)

https://reallifemag.com/bad-metaphors-close-to-the-metal/

https://doi.org/10.1080/14680777.2017.1298143

[Cursor Parks](https://knowyourmeme.com/memes/cursor-park)

[sit next to me](https://x.com/blapchat/status/1728101170537984406)

"just a click away" became a marketing scheme

# How does it work?

Think of cursor parks as an extensible, multiplayer game engine built on top of HTML. The goal is to make cursor parks:

- easily embeddable into any website
- to make it extensible so it's possible add news types of objects and interactions that cursors can interact with.
- make all of this work with realtime multiplayer

Cursors are a custom HTML element called `<mouse-cursor>`. They have attributes for a position (`x` and `y`), `color` and the current `action` (e.g. sprite). The action attribute maps to a custom sprite for the cursor like pointing, standing, sitting, etc. New cursor actions can be added the static property `MouseCursor.addAction`. Think of these HTML cursors as a material that are instrumented by the outside. Their immediate HTML parent dictates their position, current actions, and interactions. As cursors interact with different objects they are re-parented in the DOM to indicate what object the cursor is interacting with.

The default parent of a `mouse-cursor` is the custom HTML element called `<cursor-park>`. All other objects that a mouse cursor can interact with should be enclosed in this element. It's a best practice that a cursor park contains all of the web pages content (e.g. should take up the whole page). By default, a cursor wandering around a park works and looks exactly how your cursor normally is.

Inside of the park are all kinds of objects that can be interacted with. For example, when someone clicks on a `<cursor-bench>` their cursors sits on the bench. Their HTML cursor is re-parented from the park element into the bench element and a new set of interactions becomes possible. For example, the rest of the page becomes inert, their actual cursor becomes a ghost, and they can use arrow keys to scoot left or right and to kick their legs around. To get off the bench they just have to click it in order to start wandering around the park again.

# AI Workflow Note

I used AI tools during the project, but mostly as a speed-up for implementation details, not as a substitute for the actual decisions.

## Tools I used

- ChatGPT
- Cursor / GitHub Copilot style inline completion

## Where AI helped

AI was most useful for things that are repetitive or easy to get wrong when moving quickly:

- drafting small API handlers
- generating test scaffolding
- tightening validation branches
- cleaning up CSS and UI edge cases
- suggesting refactors after the basic version was already working

It also helped me move faster on the less interesting parts of the project, like repetitive DOM wiring and some documentation cleanup.

## What I changed or rejected

A lot of AI-generated code was too generic or too heavy for this project.

The main things I rejected or rewrote were:

- overbuilt auth patterns that did not fit the timebox
- abstractions that made the code harder to follow
- UI copy that sounded robotic
- test cases that looked complete on paper but did not match the actual app behavior
- styling suggestions that worked in light mode but broke dark mode consistency

In a few cases, AI suggestions pointed me in the right direction but I still rewrote the final version by hand because I wanted the code and UI behavior to stay consistent with the rest of the project.

## How I verified the work

I did not trust generated output by default.

I verified behavior through:
- local manual testing of the main user flow
- sharing tests across the seeded users
- persistence checks after refresh
- import and attachment checks
- automated API tests
- UI fixes after seeing actual browser behavior

The editor and theme work especially needed manual verification because those issues did not always show up clearly from just reading code.

## How I think about AI in a project like this

For this assignment, AI was useful when it helped me move faster on execution, but the judgment still had to come from me.

The important parts were still:
- deciding what to build
- deciding what not to build
- noticing when a generated solution was too broad or brittle
- testing the result in the browser instead of assuming it was correct

That is how I tried to use it here.

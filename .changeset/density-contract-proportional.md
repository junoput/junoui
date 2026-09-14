---
'@junoput01/junoui': patch
---

`density.css`'s header claimed that compact "removes more block (vertical) padding than
inline". That is false in absolute pixels for the control archetype, which sheds 8px of
inline against 6px of block — the reverse of what the file says, in the same file that
says it. Both archetypes do satisfy the claim proportionally (control −60%/−40%, surface
−37.5%/−25%), so the wording is now "proportionally more" and carries the four numbers.
No values changed. A new test pins the relationship rather than the numbers, including
the asymmetry that made the old wording wrong.

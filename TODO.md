# TODO

* Add unbreakable groups (for Om Ah Hung mantra for instance)
* Take into account the padding when checking if the tibetan text overflows
* Check that a translation doesn't overflow to the right at the end of a line (remove max-width and check width)
* Rename from: "sde dge'i par khang" = Derge  Printing House
* Remove the .space at the beginning of a line when it's one huge tibetan group (37 mandala in one block for instance)
* Fix the streaks calculation problem (session 1 for example says 4 but the longest is 3)
* Handle this case where a translation is split on 3 or more lines. Maybe mark each tibetan cell after translation and pick up the next unmarked one.
* If a tibetan group almost fits, use negative letter-spacing
* Remove the bar at the beginning of a group if it starts on a new page with a yigo
* Don't start a tibetan cell for only one syllable
* Use rowspan for translation-only cells
* Search the illuminator dict to split words
* Find out what would be the best way to handle the spaces between groups
* Stop crashing when a CSV file has a new line at the end

# Ideas

* Add the possibility of a custom modal message when starting a practice (remember this before starting)
* Add the possibility to place markers with comments between groups and/or on groups/syllables

# Keep in mind

* Use & instead of "and" if space is missing. Make it automatic?
* Don't move Tibetan small writings after a prayer but rather just move the translation before.

# Cases to check

* When the last cell of a tibetan line is very thin, what happens with the translation?
# Foundry VTT - Name Generator (System Agnostic)

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/elizeuangelo/fvtt-module-name-generator)
![GitHub Releases](https://img.shields.io/github/downloads/elizeuangelo/fvtt-module-name-generator/latest/name-generator.zip)
![GitHub All Releases](https://img.shields.io/github/downloads/elizeuangelo/fvtt-module-name-generator/name-generator.zip?label=downloads)

A tool designed for the fast creation of characters. Focused on name and portrait generation.

A lightweight version of the famous [**NPC Generator for 5e**](https://forge-vtt.com/bazaar/package/npc-generator-dnd5e), this version doesnt populate statblocks but it's system agnostic, intended for use in all other systems.

![application-names](/assets/imgs/jpg/2.jpg)

## How to Use

-   [Generate a new character](#generating-new-characters)
-   [Reskin a generic character](#reskining-a-character)
-   [Portrait Generation](#portraits)

### Generating new Characters 🦱

The primary way to open the application is through the **Create Character** button on the Actor's Directory Tab, on the sidebar.

![button](/assets/imgs/jpg/1.jpg)
![application](/assets/imgs/jpg/0.jpg)

### Reskining a Character 🧑‍🦱

You can also reskin a generic character, changing its name and/or portrait. Optionally, you can set for it to update all found names inside the character data and embedded items.

![reskin](/assets/imgs/jpg/3.jpg)
![reskin-application](/assets/imgs/jpg/4.jpg)

### Portraits 👁️‍🗨️

To configure portrait generation you need to create a folder like the one found in `name-generator/imgs/portraits`. From there, enter the module configuration and select the folder in the `Portrait Directory` setting.

All images inserted into the directory with the correct format will be available as a portrait to be randomly generated.

#### Image Name Format

All images in the directory should have their names formatted as the examples in the `imgs/portraits` folder, the module uses their names as tags for matching pictures, following the rules:

-   All names should be in lower-case;
-   An underline (`_`) act as a separator for different tags, you can have as many tags as you want for any picture and might use spaces as well;
-   The tags from the entire folder becomes individual filters as well, so adding a new tag to any image also adds a new filter;
-   Jobs and races are automatically matched using their lower-case title;
-   If no match is found for the applied filters, no image is returned;

## License

This work is licensed under Foundry Virtual Tabletop EULA - Limited License Agreement for Package Development - Version 11.293.

# Hallo Fraiche 🥛

Weekly meal plan services such as [HelloFresh](https://www.hellofresh.no/) and [Adams](https://www.adamsmatkasse.no/) are expensive. So I'm compiling my own list of tasty, budget-friendly recipes to help plan my weekly meals.

![image (2)](https://github.com/user-attachments/assets/b7c2e95b-0f8a-4964-9d49-9773c2659c85)

## Features ✨

* Select any meal plan to get four meals (monday, to thursday) designed to use all the ingredients in that plan.
* Scale the plan for your household size, and the shopping list adjusts automatically.

### Isn't the point to avoid shopping?💡

[Meny](https://meny.no/nettbutikk/) and [Oda](https://oda.com/no/) both offer home delivery. You dont have to step foot in a grocery store unless you want to. [Foodora markets](https://www.foodora.no/groceries) is also an option, albeit a bit more expensive.

## Quickstart 🚀

* Make sure you have [Node](https://nodejs.org/en/download) installed.

1. ✨ Clone repo `git clone https://github.com/arienshibani/hallofresh.no`

2. 🏗️ Navigate into repo and install deps `npm install`

3. 🔗 Hook up your database credentials. `echo 'MONGO_URI=YOUR_CONNECTION_STRING' > .env`
    * Make sure the `.env` file gets created at the root of the repository.
    * Ask repo admin for access if you would like to contribute.

4. ⚙️ Run the app  `npm run dev -- --open`

The application should now be available locally via your webbrowser 👉 <http://localhost:5173/>.

## Contributing 🤝

Want to share a good recipe or do you have a meal plan you'd like to share? Feel free to contribute by [sending it to me](mailto:aaari94@gmail.com?subject=Hallofresh feedback)!

### Example recipe object

Depicted below is an example recipe object.

```json
{
  "title": "Kremet Spaghetti 🍝", // Tittel på oppskriften
  "subtitle": "med sjampinjong og soltørkede tomater", // Undertekst
  "prepTime": 20, // Hvor mange minutter tar det å lage retten?
  "portions": 1, // Hvor mange prosjoner vil ingrediens listen produsere?
  "steps": [ // Stegene som skal til for å lage maten.
    "Kutt opp sjampinjong 🍄 og finhakk hvitløksfedd 🧄",
    "Kok spagettien 🌾 i en stor kjele.",
    "Stek hvitløken 🧄, soltørkede tomater 🍅 og sjampinjong 🍄 i en stekepanne i cirka 10 minutter på medium-høy varme.",
    "Når sjampinjongen 🍄 begynner å bli blank og har krympet i størrelse kan du tilsette basilikum 🌿 og salt / pepper 🧂. La det surre litt på svak varme.",
    "Tilsett matfløte 🥛 og vann 💧 i pannen og kok opp mens du rører rundt. Tilsett cirka 1 håndfull spinat 🥬 og la det synke sammen i sausen.",
    "Når spaghettien 🌾 er ferdigkokt, heller du av vannet og tilsetter sausen. Server gjerne med maldonsalt og/eller parmesan ost hvis du har det."
  ],
  // Liste over ingredienser.
  "recipeIngredients": [
    {
      "name": "Spagetti 🌾",
      "amount": 100,
      "measurement": "g"
    },
    {
      "name": "Spinat 🥬",
      "amount": 100,
      "measurement": "g"
    },
    {
      "name": "Soltørkede Tomater 🍅",
      "amount": 60,
      "measurement": "g"
    },
    {
      "name": "Sjampinjong 🍄",
      "amount": 60,
      "measurement": "g"
    },
    {
      "name": "Matfløte 🥛",
      "amount": 0.5,
      "measurement": "dl"
    },
    {
      "name": "Vann 💧",
      "amount": 0.25,
      "measurement": "dl",
      "isBulkItem": true
    },
    {
      "name": "Tørket Basilikum 🌿",
      "amount": 1,
      "measurement": "ss",
      "isBulkItem": true
    },
    {
      "name": "Hvitløksfedd 🧄",
      "amount": 1,
      "measurement": "stk"
    }
  ],
  "recipeId": "123123",
}
```

## Roadmap 🗺️

* [Kassal.app](https://kassal.app/) integration, for fetching prices per recipe / mealplan. 💰
* More mealplans and recipes? 🤷‍♂️

# <img src="https://github.com/user-attachments/assets/de7cbfd5-6d67-4e7b-9358-0729b76fe842" width="45" align="left"> rdr

<div align="left">

<p align="left">
  <img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dpi0/rdr-firefox/ci.yml?branch=main">
  <img alt="GitHub Forks" src="https://img.shields.io/github/forks/dpi0/rdr-firefox?style=flat">
  <img alt="GitHub Contributors" src="https://img.shields.io/github/contributors/dpi0/rdr-firefox?style=flat&color=pink">
  <img alt="GitHub License" src="https://img.shields.io/github/license/dpi0/rdr-firefox?style=flat">
</p>

<h4>Re-director for Firefox</h4>

<a href="https://addons.mozilla.org/firefox/addon/rdr">
  <img src="https://i.ibb.co/wZS8XBX0/firefox-download-dark-nobg.png" alt="Get it on Firefox" width="120">
</a>

</p>

</div>

Heavily inspired by [einaregilsson/Redirector](https://github.com/einaregilsson/Redirector).

<p align="center">
  <img
    width="1244"
    height="700"
    alt="rdr - options page"
    src="https://github.com/user-attachments/assets/6009b33f-63bb-4af9-a146-389fe20e6728"
  />
  <br />
  <em>rdr — options page</em>
</p>

> [!WARNING]
> Made with ChatGPT 5.2 (Go Plan) and Google Gemini 3 Pro Preview (Free Plan)

## Quickstart

In your toolbar or the addons list, Hit the "rdr" icon. This will open the options page.

On the options page, paste or import (.json file) your rules for redirection.

You can download the provided quickstart rules by [clicking here](https://github.com/dpi0/rdr-firefox/releases/latest/download/rdr-quickstart-rules.json) or by checking out the latest release.

Make sure to hit **save** after you've imported your rules!

You can also export your rules to a `.json` file to import later.

## Keybinds

Hit `Alt+Shift+O` (default) to go back to the Original URL (xcancel --> Twitter).

Hit `Alt+Shift+R` (default) to the Re-directed URL (Twitter --> xcancel).

Update the default keybinds from `about:addons` by hitting the "Gear" icon and "Manage Extension Shortcuts".

## Context Menu

Right-click on a page to either "Go to Original" or "Go to Redirection".

Right-click on a URL to open that URL either redirected or original.

## How Do the Rules Work?

Rules follow regex for URL Pattern detection and "Capture Groups" for Replacement.

These rules are basically a one-to-one copy of the ones used for [einaregilsson/Redirector#examples](https://github.com/einaregilsson/Redirector#examples).

They are matched from top to bottom so the first one that matches "wins" and the rest are ignored.

An example rule to redirect "Twitter" to "Nitter"

```json
[
  {
    "description": "Twitter / X → Nitter",
    "includePattern": "https?://(www\\.)?(twitter|x)\\.com/(.*)",
    "redirectUrl": "https://xcancel.com/$3"
  }
]
```

1. `description`: Arbitrary string to describe your rule.
2. `includePattern`: Uses regex to match the URL in the address bar (honestly just use LLMs like ChatGPT to create these).

    All of these URLs match for the above pattern,

    ```text
   https://twitter.com/user/status/123
    https://x.com/user
    https://www.twitter.com/search?q=test
    ```
3. `redirectUrl`: What to replace the URL with? Uses "Capture Groups" for replacement
   - `https?://(www\\.)?(twitter|x)\\.com/(.*)` has 3 capture groups **(www\\.)**, **(twitter|x)** and **(.*)**
   - Capture groups are created with Parantheses (...) from left to right. I'll call this "CG".
   - So if the original URL was `https://twitter.com/jack/status/20`. CG1 is empty, CG2 is `twitter` and CG3 is `jack/status/20`.
   - In `https://xcancel.com/$3`, `$3` is replaced with CG3 and rest stays the same.
   - The redirected URL finally becomes `https://xcancel.com/jack/status/20`.

Another example

```json
[
  {
    "description": "Medium → Scribe",
    "includePattern": "https?://(?:([a-z0-9-]+)\\.)?medium\\.com/(.*)",
    "redirectUrl": "https://scribe.rip/$1/$2"
  }
]
```

- `includePattern` has 2 Capture Groups (CGs) - CG1 **(?:([a-z0-9-]+)\\.)** and CG2 **(.*)**
- `redirectUrl` is `https://scribe.rip/$1/$2` where `$1` will be replaced by CG1 and `$2` by CG2.
- For `https://slavesincstrip.medium.com/our-troubled-relationship-with-food-73af21251061`, CG1 `slavesincstrip` and CG2 `our-troubled-relationship-with-food-73af21251061`
- So the final redirected URL becomes `https://scribe.rip/slavesincstrip/our-troubled-relationship-with-food-73af21251061`

Hopefully this clears things up.

## Sample Rules

You can build any rule you want, below are some I created for myself.

1. Many Stack Exchange sites (190+) --> [AnonymousOverflow](https://github.com/httpjamesm/AnonymousOverflow)

    Recommended to use it's maintained fork [git.canine.tools/canine.tools/anonymous_overflow](https://git.canine.tools/canine.tools/-/packages/container/anonymous_overflow/latest)
    ```json
    [
      {
        "description": "Stack Exchange subdomains → AnonymousOverflow",
        "includePattern": "https?://([a-z0-9-]+)\\.stackexchange\\.com/(.*)",
        "redirectUrl": "https://overflow.canine.tools/exchange/$1/$2"
      },
      {
        "description": "Standalone Stack Exchange sites → AnonymousOverflow",
        "includePattern": "https?://(superuser|askubuntu|serverfault)\\.com/(.*)",
        "redirectUrl": "https://overflow.canine.tools/exchange/$1.com/$2"
      },
      {
        "description": "Stack Overflow → AnonymousOverflow",
        "includePattern": "https?://stackoverflow\\.com/(.*)",
        "redirectUrl": "https://overflow.canine.tools/$1"
      }
    ]
    ```
2. Genius --> [Dumb](https://github.com/rramiachraf/dumb)
    ```json
    [
      {
        "description": "Genius → Dumb",
        "includePattern": "https?://(www\\.)?genius\\.com/(.*)",
        "redirectUrl": "https://dumb.ducks.party/$2"
      }
    ]
    ```
3. Twitter --> [Nitter](https://github.com/zedeus/nitter)
    ```json
    [
      {
        "description": "Twitter / X → Nitter",
        "includePattern": "https?://(www\\.)?(twitter|x)\\.com/(.*)",
        "redirectUrl": "https://xcancel.com/$3"
      }
    ]
    ```
4. Tenor --> [Soprano](https://git.vern.cc/cobra/Soprano)
    ```json
    [
      {
        "description": "Tenor → Soprano",
        "includePattern": "https?://(www\\.)?tenor\\.com/(.*)",
        "redirectUrl": "https://soprano.catsarch.com/$2"
      }
    ]
    ```
5. Imgur --> [Rimgo](https://codeberg.org/rimgo/rimgo)
    ```json
    [
      {
        "description": "Imgur → Rimgo",
        "includePattern": "https?://(i\\.)?imgur\\.com/(.*)",
        "redirectUrl": "https://rimgo.catsarch.com/$2"
      }
    ]
    ```
6. Reddit --> [Redlib](https://github.com/redlib-org/redlib)
    ```json
    [
      {
        "description": "Reddit → Redlib",
        "includePattern": "https?://(www\\.|old\\.)?reddit\\.com/(.*)",
        "redirectUrl": "https://redlib.catsarch.com/$2"
      }
    ]
    ```
7. Medium --> [Scribe](https://sr.ht/~edwardloveall/Scribe/)
    ```json
    [
      {
        "description": "Medium → Scribe",
        "includePattern": "https?://(?:([a-z0-9-]+)\\.)?medium\\.com/(.*)",
        "redirectUrl": "https://scribe.rip/$1/$2"
      }
    ]
    ```

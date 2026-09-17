# ⚡ Setup — do this before you arrive

**20 minutes.** Do it at your desk, not in the room.

---

## 1. Check what you already have

```bash
node --version   # need v22.13 or higher
git --version    # any recent version
```

If Node is missing or older than v22.13, install the **LTS** build from
[nodejs.org/en/download](https://nodejs.org/en/download), then **open a new terminal** and
check again.

> 🔒 **If your laptop blocks installs**, raise the ticket now — approval takes longer than
> the hackathon does.

---

## 2. Install the GitHub Copilot app

Follow [Lesson 1 of the official workshop](https://github-samples.github.io/copilot-workshops/app/1-install-copilot-app/).

Then check:

- [ ] The app launches
- [ ] You're signed in **with your work GitHub account**, not a personal one
- [ ] You can see your organisation's repositories

> 🚨 **App won't sign in?** On Copilot Business or Enterprise this is almost always an admin
> policy, and you can't fix it yourself. **Tell your facilitator today, not on the day.**

---

## 3. Make your copy of the lab app

1. Go to **[tdupoiron/tailspin-toys](https://github.com/tdupoiron/tailspin-toys)**
2. **Use this template** → **Create a new repository**
3. ⚠️ Create it in the org your facilitator gave you — **not your personal account**

Write it down so you're not hunting for it later:

```
My repo: github.com/ ______________ / ______________
```

Your new repo comes with a **starter backlog of feature issues** already filed — that backlog is
your hackathon material, so you don't have to invent anything.

> 🔒 **"Use this template" doesn't work?** If your company uses Enterprise Managed Users this
> can be restricted. Tell your facilitator — there's a prepared fallback repo.

> 🔁 **Already created it under your personal account?** You don't have to start over.
> Open the repo → **Settings** → **Transfer ownership** → pick the org. Issues, branches and
> history all move with it. If you'd already added it to the Copilot app, remove the project and
> add it again at its new location.

---

## 4. Prove it runs

Do this **in the Copilot app** — you won't need a terminal.

1. In the app, add your repo as a project (**Add project** → pick `<your-org>/<your-repo>`).
   The app clones it for you.
2. Start a **new session** on that project.
3. Ask the agent, in plain English:

   > Install the dependencies and run the unit tests, then tell me the result.

4. Approve the commands when the app asks.

Tests running — even with failures — means you're ready. The agent will use those same tests to
check its own work during the hackathon.

Want to see the site too? In the same session, ask:

> Start the dev server and open it in a browser canvas.

> ℹ️ **Heads up:** only the unit tests are needed for setup. The end-to-end suite builds the
> site and downloads a browser, so leave that for the day itself.

---

## ✅ Ready

- [ ] Node 22.13+ and git
- [ ] Copilot app signed in with **work** identity
- [ ] My repo exists, in the **right org**
- [ ] The Copilot app has my repo as a project, and the unit tests have run at least once
- [ ] I know my repo URL

**Bring a laptop that can install things and reach the internet.** If you'll be on guest
wifi, test it in advance.

See you there 🚀

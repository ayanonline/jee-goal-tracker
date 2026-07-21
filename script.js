/* ==========================================
   PRETRACK LANDING PAGE
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ===========================
       STICKY NAVBAR
    =========================== */

    const header = document.querySelector("header");

    window.addEventListener("scroll", () => {

        if (window.scrollY > 80) {

            header.classList.add("scrolled");

        }

        else {

            header.classList.remove("scrolled");

        }

    });

    /* ===========================
       SMOOTH SCROLL
    =========================== */

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function (e) {

            e.preventDefault();

            document.querySelector(this.getAttribute("href"))
                .scrollIntoView({

                    behavior: "smooth"

                });

        });

    });

    /* ===========================
       SCROLL REVEAL
    =========================== */

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

            }

        });

    }, {

        threshold: .15

    });

    document.querySelectorAll(

        ".feature,.subject-card,.exam-grid div,.faq div,.cta"

    ).forEach(el => {

        el.classList.add("hidden");

        observer.observe(el);

    });

});

/* ===========================
   FLOATING PARTICLES
=========================== */

const bg = document.querySelector(".background");

for (let i = 0; i < 25; i++) {

    const dot = document.createElement("span");

    dot.className = "particle";

    dot.style.left = Math.random() * 100 + "%";

    dot.style.top = Math.random() * 100 + "%";

    dot.style.animationDelay = Math.random() * 8 + "s";

    dot.style.animationDuration = (6 + Math.random() * 8) + "s";

    bg.appendChild(dot);

}

/* ===========================
   CURSOR GLOW
=========================== */

const glow = document.createElement("div");

glow.className = "cursor-glow";

document.body.appendChild(glow);

document.addEventListener("mousemove", e => {

    glow.style.left = e.clientX + "px";

    glow.style.top = e.clientY + "px";

});

/* ===========================
   HERO TYPING EFFECT
=========================== */

const heading = document.querySelector(".hero h1");

const text = heading.innerText;

heading.innerText = "";

let i = 0;

function type() {

    if (i < text.length) {

        heading.innerHTML += text.charAt(i);

        i++;

        setTimeout(type, 45);

    }

}

type();

/* ===========================
   PARALLAX
=========================== */

window.addEventListener("mousemove", (e) => {

    const x = (e.clientX / window.innerWidth - .5) * 20;

    const y = (e.clientY / window.innerHeight - .5) * 20;

    const hero = document.querySelector(".hero-right img");

    if (hero) {

        hero.style.transform =

            `translate(${x}px,${y}px)`;

    }

});
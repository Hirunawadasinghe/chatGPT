const grt_msgs = [
    'How can I help you?',
    'What can I help with?',
    'Where should we begin?',
    'What are you working on?',
    'Hey, ready to dive in?',
    'What’s on the agenda today?',
    'Ready when you are.',
    'What’s on your mind today?',
    'Good to see you.'
];

const grt_msg = document.getElementById('grt-msg');
window.addEventListener('load', () => {
    grt_msg.innerText = grt_msgs[Math.floor(Math.random() * grt_msgs.length)];
});

const content_w = document.getElementById('content');
const chat_prev = document.getElementById('chat');
const in_form = document.getElementById('in-form');
const prompt_in = document.getElementById('input');
const send_btn = document.getElementById('send-btn');

let chat_state = true;
let msg_id = 0;
let conversation = [];
const max_conversation_len = 20;

function t_chat_state(s) {
    chat_state = s;
    send_btn.classList.toggle('stop', !s);
}

function scroll_down() {
    chat_prev.scrollTo({ top: chat_prev.scrollHeight, behavior: "smooth" });
}

function create_msg(by_user = false) {
    if (msg_id == 0) {
        content_w.classList.add('open');
    }

    msg_id++;
    const c_id = `msg-${msg_id}`;
    chat_prev.innerHTML += `<div class="msg${by_user ? ' user' : ''}"><div id="${c_id}"></div></div>`;
    scroll_down();

    return c_id;
}

function push_conversation(msg, by_user = false) {
    conversation.push({
        role: by_user ? 'user' : 'assistant',
        content: msg
    });
    if (conversation.length > max_conversation_len) {
        conversation.splice(0, conversation.length - max_conversation_len);
    }
}

function print_msg(msg, msg_id) {
    const e = document.getElementById(msg_id);
    const w = msg.split(' ');
    let i = 0;
    function print_w() {
        setTimeout(() => {
            e.innerText += `${i == 0 ? '' : ' '}${w[i]}`;
            scroll_down();
            i++;
            if (i < w.length && !chat_state) {
                print_w();
            } else {
                t_chat_state(true);
            }
        }, Math.random() * 100);
    }
    print_w();
}

send_btn.addEventListener('click', () => {
    if (!chat_state) { t_chat_state(true); }
});

in_form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const prompt = prompt_in.value.trim();
    if (!prompt || !chat_state) { return; }
    prompt_in.value = '';
    t_chat_state(false);

    document.getElementById(create_msg(true)).innerText = prompt;
    push_conversation(prompt, true);

    try {
        const id = create_msg();
        const msg = document.getElementById(id);
        msg.classList.add('load');

        const push_con = [
            {
                role: "system",
                content: "Reply briefly. Maximum 3 sentences unless asked otherwise."
            },
            ...conversation
        ];

        let r = await puter.ai.chat(push_con, {
            model: "gpt-5-nano",
            max_tokens: 800
        });

        // fall back
        if (r.finish_reason === 'length') {
            r = await puter.ai.chat(push_con, {
                model: "gpt-5-nano"
            });
        }

        msg.classList.remove('load');

        if (!r.message?.content) { throw new Error("API Error."); }

        print_msg(r.message.content, id);
        push_conversation(r.message.content);
    } catch (err) {
        const id = create_msg();
        print_msg(err.message || String(err), id);
    }

    // Stream responses for longer queries 
    // try {
    //     const msg = document.getElementById(create_msg());
    //     msg.classList.add('load');
    //     const r = await puter.ai.chat(prompt, {
    //         stream: true
    //     });
    //     msg.classList.remove('load');

    //     for await (const part of r) {
    //         if (chat_state) { break; }
    //         msg.innerText += part?.text || '';
    //         scroll_down();
    //     }
    //     t_chat_state(true);
    // } catch (err) {
    //     const id = create_msg();
    //     print_msg(err, id)
    // }
});

in_form.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        in_form.requestSubmit();
    }
});

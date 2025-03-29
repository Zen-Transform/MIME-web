from flask import Flask, request, jsonify

from multilingual_ime.key_event_handler import KeyEventHandler

app = Flask(__name__)

my_key_event_handler = KeyEventHandler(verbose_mode=True)
my_key_event_handler.set_activation_status("special", False)
my_key_event_handler.set_activation_status("japanese", False)


@app.route("/handle_key", methods=["POST"])
def process_input():
    data: dict = request.get_json()
    key = data.get("key")
    print("in_key:", key)
    try:
        my_key_event_handler.handle_key(key)

        # Convert token index to cursor index
        total_composition_words = my_key_event_handler.total_composition_words
        composition_index = my_key_event_handler.composition_index
        cursor_index = len("".join(total_composition_words[:composition_index]))

        data = {
            "in_selection_mode": my_key_event_handler.in_selection_mode,
            "composition_string": my_key_event_handler.composition_string,
            "candidate_list": my_key_event_handler.candidate_word_list,
            "cursor_index": cursor_index,
            "selection_index": my_key_event_handler.selection_index,
            "commit_string": my_key_event_handler.commit_string,
        }

        return jsonify(data)
    except Exception as e:
        print(e)
        return jsonify({"error": "Invalid input"})


@app.route("/slow_handle", methods=["POST"])
def process_slow_handle():
    my_key_event_handler.slow_handle()

    # Convert token index to cursor index
    total_composition_words = my_key_event_handler.total_composition_words
    composition_index = my_key_event_handler.composition_index
    cursor_index = len("".join(total_composition_words[:composition_index]))

    data = {
        "in_selection_mode": my_key_event_handler.in_selection_mode,
        "composition_string": my_key_event_handler.composition_string,
        "candidate_list": my_key_event_handler.candidate_word_list,
        "cursor_index": cursor_index,
        "selection_index": my_key_event_handler.selection_index,
        "commit_string": my_key_event_handler.commit_string,
    }

    return jsonify(data)


@app.route("/update_config", methods=["POST"])
def process_update_config():
    data: dict = request.get_json()
    config: dict = data.get("config")
    my_key_event_handler.set_activation_status(
        "bopomofo", config.get("bopomofoEnabled")
    )
    my_key_event_handler.set_activation_status("english", config.get("englishEnabled"))
    my_key_event_handler.set_activation_status("cangjie", config.get("cangjieEnabled"))
    my_key_event_handler.set_activation_status("pinyin", config.get("pinyinEnabled"))
    print("success update config")
    return jsonify({"success": "Config Update successfully"})


if __name__ == "__main__":
    app.run(port=5000, debug=True)

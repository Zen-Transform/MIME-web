from flask import Flask, request, jsonify
from multilingual_ime.muti_ime import KeyEventHandler

app = Flask(__name__)

my_key_event_handler = KeyEventHandler()

@app.route('/handle_key', methods=['POST'])
def process_input():
    while True:
        data = request.get_json()
        key = data['key']
        print("in_key:", key)
        try:
            my_key_event_handler.handle_key(key)
            data = {
                'in_seletion_mode': my_key_event_handler.in_selection_mode,
                'composition_string': my_key_event_handler.composition_string,
                'candidate_list': my_key_event_handler.candidate_word_list,
                'cursor_index': my_key_event_handler.composition_index,
                'selection_index': my_key_event_handler.selection_index,
            }
            print(data)

            return jsonify(data)
        except Exception as e:
            print(e)
            return jsonify({'error': 'Invalid input'})

@app.route('/slow_handle', methods=['POST'])
def process_slow_handle():
    my_key_event_handler.slow_handle()
    data = {
        'in_seletion_mode': my_key_event_handler.in_selection_mode,
        'composition_string': my_key_event_handler.composition_string,
        'candidate_list': my_key_event_handler.candidate_word_list,
        'cursor_index': my_key_event_handler.composition_index,
        'selection_index': my_key_event_handler.selection_index,
    }

    return jsonify(data)

if __name__ == '__main__':
    app.run(port=5000, debug=True)

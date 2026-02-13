#!/usr/bin/env python3
"""
Chrome Native Messaging Host: 選択したパスをエクスプローラーで開く
stdin から長さ付きJSONを受け取り、path をエクスプローラーで開く
"""
import sys
import os
import json
import struct
import subprocess

def read_message():
    """Chrome からのメッセージを読み取る（4バイト長 + JSON）"""
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        sys.exit(0)
    length = struct.unpack('=I', raw_length)[0]
    message = sys.stdin.buffer.read(length).decode('utf-8')
    return json.loads(message)

def send_message(obj):
    """Chrome へメッセージを送る（4バイト長 + JSON）"""
    encoded = json.dumps(obj).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('=I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()

def open_in_explorer(path):
    """Windows エクスプローラーでパスを開く"""
    path = path.strip().strip('"').strip("'")
    if not os.path.exists(path):
        return False, "パスが存在しません"
    try:
        # フォルダならそのまま開く。ファイルなら親フォルダを開いてファイルを選択
        # explorer.exe はフォルダを開いても終了コード 1 を返すことがあるため check=False
        if os.path.isfile(path):
            result = subprocess.run(['explorer', '/select,' + path], check=False, shell=False)
        else:
            result = subprocess.run(['explorer', path], check=False, shell=False)
        # 0=成功, 1=Windowsの仕様で成功時にも返ることがある → いずれも成功とみなす
        if result.returncode not in (0, 1):
            return False, f"explorer が終了コード {result.returncode} で終了しました"
        return True, None
    except Exception as e:
        return False, str(e)

def main():
    try:
        message = read_message()
        path = message.get('path', '')
        if not path:
            send_message({'success': False, 'error': 'パスが指定されていません'})
            return
        success, error = open_in_explorer(path)
        send_message({'success': success, 'error': error} if not success else {'success': True})
    except Exception as e:
        send_message({'success': False, 'error': str(e)})

if __name__ == '__main__':
    main()

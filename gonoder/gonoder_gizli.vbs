' gonoder'ı GİZLİ pencerede başlatır (Windows başlangıcı için)
' backend venv python kullanır (requests kurulu)
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """C:\Users\Administrator\Desktop\hakedis-v2\backend\venv\Scripts\python.exe"" ""C:\Users\Administrator\Desktop\hakedis-v2\gonoder\gonoder.py""", 0, False

import os
import sys

# Prevent transformers / sentence-transformers from attempting to load tensorflow / keras
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
if "tensorflow" not in sys.modules:
    sys.modules["tensorflow"] = None


import accounts
from accounts.apps import AccountsConfig
from django.test import SimpleTestCase


class AccountsAppConfigTests(SimpleTestCase):
    def test_app_config_is_correct(self):
        config = AccountsConfig("accounts", accounts)
        self.assertEqual(config.name, "accounts")
        self.assertEqual(config.default_auto_field, "django.db.models.BigAutoField")

from django.db import migrations
def fix(apps, schema_editor):
    apps.get_model("accounts", "User").objects.filter(is_superuser=True).update(role="ADMIN")
class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_user_photo")]
    operations = [migrations.RunPython(fix, migrations.RunPython.noop)]
import { chmodSync } from "node:fs";
import { execFileSync } from "node:child_process";

// POSIX modes do not restrict Windows ACLs. Protect backups before writing data.
export function restrictPrivatePath(path, directory = false) {
  if (process.platform !== "win32") { chmodSync(path, directory ? 0o700 : 0o600); return; }
  const script = `
$ErrorActionPreference = 'Stop'
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
$system = [System.Security.Principal.SecurityIdentifier]::new('S-1-5-18')
$isDirectory = $env:MONO_PRIVATE_DIRECTORY -eq 'true'
$acl = if ($isDirectory) { [System.Security.AccessControl.DirectorySecurity]::new() } else { [System.Security.AccessControl.FileSecurity]::new() }
$acl.SetAccessRuleProtection($true, $false)
$acl.SetOwner($identity)
$inherit = if ($isDirectory) { [System.Security.AccessControl.InheritanceFlags]'ContainerInherit, ObjectInherit' } else { [System.Security.AccessControl.InheritanceFlags]::None }
foreach ($sid in @($identity, $system)) {
  $rule = [System.Security.AccessControl.FileSystemAccessRule]::new($sid, 'FullControl', $inherit, [System.Security.AccessControl.PropagationFlags]::None, 'Allow')
  $acl.AddAccessRule($rule)
}
if ($isDirectory) { [System.IO.Directory]::SetAccessControl($env:MONO_PRIVATE_PATH, $acl) }
else { [System.IO.File]::SetAccessControl($env:MONO_PRIVATE_PATH, $acl) }
`;
  execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], {
    env: { ...process.env, MONO_PRIVATE_PATH: path, MONO_PRIVATE_DIRECTORY: String(directory) },
    stdio: "pipe", windowsHide: true,
  });
}

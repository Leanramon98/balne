# Verify the preserved DTI boundary

This evidence identifies the last captured DTI source boundary without claiming that the dirty working tree is an immutable snapshot. No tag, archive, branch, commit, or staging operation was created.

## Verify now

```bash
scripts/verify-preservation.sh
tests/preservation/verify-preservation-test.sh
```

The verifier checks the immutable commit/tree pair, generator source/output classification, file and migration-tree hashes, the active `audit-log-full-tracking` tree, and protected pre-existing dirty entries. Any malformed/incomplete metadata or hash drift fails closed.

## Verify the original dirty boundary

Run `scripts/verify-preservation.sh` in the original worktree. This full mode verifies both source artifacts and every protected dirty entry against the signed count/digest; it is expected to fail in a clean checkout.

## Verify source recovery in a clean checkout

```bash
git cat-file -e 61d1204432f23292c5236261da98b647fbb14be9^{commit}
git worktree add --detach ../project-base-dti-recovery 61d1204432f23292c5236261da98b647fbb14be9
cp -R preservation scripts tests/preservation ../project-base-dti-recovery/
(cd ../project-base-dti-recovery && scripts/verify-preservation.sh --source-only)
```

Source-only mode still validates the complete dirty-boundary metadata digest, but truthfully does not assert that original untracked/deleted states exist in the clean recovery checkout. The `git worktree add` command is a recovery reference; remove the worktree after rehearsal. A future release must pin `core-cli` before claiming byte-for-byte regeneration. Generated outputs were inventoried only and were not hand-edited.

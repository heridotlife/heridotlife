# Auto PR Workflow: Develop → Main

This document explains the automatic pull request workflow from `develop` to `main`.

## Overview

**Workflow File**: `.github/workflows/auto-pr-develop-to-main.yml`

**Purpose**: Automatically creates or updates a PR from `develop` to `main` when feature branches are merged to `develop`.

## How It Works

```
Feature branch merged to develop
    ↓
GitHub Action triggered
    ↓
Check if PR already exists
    ↓
┌─────────────────┬──────────────────┐
│ PR exists       │ No PR exists     │
├─────────────────┼──────────────────┤
│ Add comment     │ Create new PR    │
│ with changes    │ as DRAFT         │
└─────────────────┴──────────────────┘
```

## Workflow Behavior

### If PR Already Exists

The workflow will:

1. ✅ Find the existing open PR from `develop` to `main`
2. ✅ Add a comment with:
   - Latest commit message
   - Who pushed the changes
   - Commit SHA
3. ✅ Notify reviewers of new changes

### If No PR Exists

The workflow will:

1. ✅ Create a new PR from `develop` to `main`
2. ✅ Set it as **DRAFT** (requires manual approval)
3. ✅ Add labels: `release`, `auto-pr`
4. ✅ Include:
   - List of recent commits
   - Pre-merge checklist
   - Deployment impact summary
   - Review information

## Example PR Body

```markdown
## 🚀 Release: Develop to Main

This PR was automatically created when changes were merged to the `develop` branch.

### 📝 Recent Changes
```

abc1234 Add new feature
def5678 Fix bug in authentication
ghi9012 Update dependencies

```

### ✅ Pre-merge Checklist

Before merging this PR to `main`, ensure:

- [ ] All tests pass (`pnpm test`)
- [ ] Code has been reviewed
- [ ] No breaking changes (or properly documented)
- [ ] Deployment validation passed (`pnpm validate`)
- [ ] Ready for production deployment

### 🌐 Deployment Impact

Merging this PR will trigger:
- ✅ Cloudflare automatic deployment to production
- ✅ Updates to all routes:
  - `heri.life` (production)
  - `www.heri.life` (production)
  - `heridotlife.workers.dev` (staging)
```

## Workflow Triggers

**Triggers when:**

- ✅ Feature branch merged to `develop`
- ✅ Direct push to `develop`
- ✅ Hotfix merged to `develop`

**Does NOT trigger when:**

- ❌ PR created (only on merge)
- ❌ Push to other branches
- ❌ Tag creation

## Best Practices

### 1. Keep Develop Stable

- Only merge reviewed and tested code to `develop`
- Run `pnpm validate` before merging to `develop`
- Ensure all tests pass

### 2. Review Auto-Created PRs

- Don't auto-merge PRs from `develop` to `main`
- Always review the changes
- Check the pre-merge checklist
- Validate deployment config

### 3. Use Draft Status

- PRs are created as **drafts** by default
- Mark as "Ready for review" when tested
- Assign reviewers when ready

### 4. Branch Protection

Recommended branch protection rules:

**For `develop` branch:**

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass
- ✅ Require branches to be up to date

**For `main` branch:**

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Do not allow bypassing the above settings

## Development Flow

### Standard Feature Development

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Develop and commit
git add .
git commit -m "Add feature"

# 3. Push and create PR to develop
git push origin feature/my-feature
# Create PR: feature/my-feature → develop

# 4. After review, merge to develop
# → Auto PR workflow triggers!
# → PR created/updated: develop → main
```

### Multiple Features Flow

```bash
# Feature 1
feature/feature-a → develop (merged)
  → Auto PR: develop → main (created as draft)

# Feature 2
feature/feature-b → develop (merged)
  → Auto PR: develop → main (updated with comment)

# Feature 3
feature/feature-c → develop (merged)
  → Auto PR: develop → main (updated with comment)

# Review all changes in single PR
develop → main (reviewed and merged)
  → Cloudflare deploys to production
```

## Monitoring

### GitHub Actions Tab

1. Go to **Actions** tab in GitHub
2. Look for workflow: "Auto PR from Develop to Main"
3. Click on latest run to see:
   - Whether PR was created or updated
   - PR number
   - Status and logs

### Pull Requests Tab

1. Go to **Pull Requests** tab
2. Look for PR with labels:
   - `release`
   - `auto-pr`
3. Check if it's a draft or ready for review

## Troubleshooting

### Workflow Not Triggering

**Possible causes:**

1. Push was to wrong branch (not `develop`)
2. Workflow permissions not set correctly
3. GitHub Actions disabled for repository

**Solution:**

- Verify push was to `develop` branch
- Check repository settings → Actions → General → Workflow permissions
- Enable "Allow GitHub Actions to create and approve pull requests"

### Duplicate PRs Created

**Possible causes:**

1. Workflow ran multiple times simultaneously
2. PR check query didn't work correctly

**Solution:**

- Close duplicate PRs manually
- Check workflow logs for errors
- Verify GitHub CLI is working correctly

### PR Not Created

**Possible causes:**

1. Permissions issue
2. No difference between `develop` and `main`
3. GitHub CLI error

**Solution:**

- Check workflow logs in Actions tab
- Verify permissions in repository settings
- Ensure there are actual changes between branches

### Comment Not Added to Existing PR

**Possible causes:**

1. PR was closed
2. PR check found wrong PR
3. GitHub token permissions issue

**Solution:**

- Verify PR is still open
- Check PR number in workflow logs
- Verify `pull-requests: write` permission is set

## Customization

### Change PR Template

Edit the `PR_BODY` section in the workflow:

```yaml
PR_BODY=$(cat <<EOF
Your custom PR template here...
EOF
)
```

### Add Reviewers

Add `--reviewer` flag to the `gh pr create` command:

```yaml
gh pr create \
  --base main \
  --head develop \
  --title "Release: Develop → Main" \
  --body "$PR_BODY" \
  --label "release,auto-pr" \
  --reviewer username1,username2 \
  --draft
```

### Change Labels

Modify the `--label` flag:

```yaml
--label "release,auto-pr,needs-review"
```

### Skip Draft Status

Remove `--draft` flag to create as ready-for-review:

```yaml
gh pr create \
--base main \
--head develop \
---
# Remove --draft line
```

## Security Considerations

### Permissions

The workflow uses:

- `contents: read` - Read repository contents
- `pull-requests: write` - Create and update PRs

These are minimal required permissions following least-privilege principle.

### GitHub Token

Uses `${{ github.token }}` which is:

- ✅ Automatically provided by GitHub
- ✅ Scoped to the repository
- ✅ Expires after workflow completes
- ✅ No need to create/manage tokens manually

### Repository Settings

Required setting:

- **Settings** → **Actions** → **General** → **Workflow permissions**
- Enable: "Allow GitHub Actions to create and approve pull requests"

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Workflow Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)

---

**Last Updated**: November 2, 2025
**Workflow Version**: 1.0
**Status**: Active

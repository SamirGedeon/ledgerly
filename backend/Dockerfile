# syntax=docker/dockerfile:1
FROM ruby:3.3-slim-bookworm
WORKDIR /app
RUN apt-get update -qq && apt-get install -y --no-install-recommends build-essential libpq-dev libyaml-dev pkg-config && rm -rf /var/lib/apt/lists/*
ENV BUNDLE_PATH=/usr/local/bundle
COPY Gemfile Gemfile.lock ./
# Optional enterprise/cloud CA; never disables certificate verification.
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export SSL_CERT_FILE=/run/secrets/proxy_ca; fi; \
    bundle install && rm -rf /usr/local/bundle/cache
RUN useradd --create-home --uid 1000 app
COPY --chown=app:app . .
RUN mkdir -p log tmp/pids && chown -R app:app log tmp
USER app
EXPOSE 3000
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
